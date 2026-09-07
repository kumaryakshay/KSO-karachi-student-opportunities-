import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function jsonResponse(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    }
  );
}

const SYSTEM_INSTRUCTION = `
You are KSO Assistant, a friendly and knowledgeable guide for students in Pakistan.

Help students with:
- Scholarships
- Internships
- Courses
- Competitions
- Training programs
- Fellowships
- Career advice
- Eligibility and deadlines

IMPORTANT:
Only recommend opportunities that appear in the database list below.
Never invent an opportunity.
When mentioning an opportunity, use its exact title and organization.
Keep normal answers concise and friendly.

ACTIVE OPPORTUNITIES:
{OPPORTUNITIES_LIST}
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Only POST requests are allowed." },
      405
    );
  }

  try {
    console.log("chat-assistant started");

    // ─────────────────────────────────────────
    // Environment
    // ─────────────────────────────────────────

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const geminiApiKey =
      Deno.env.get("GEMINI_API_KEY");

    const publishableKeysRaw =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");

    const secretKeysRaw =
      Deno.env.get("SUPABASE_SECRET_KEYS");

    if (!supabaseUrl) {
      return jsonResponse(
        { error: "SUPABASE_URL is missing." },
        500
      );
    }

    if (!geminiApiKey) {
      return jsonResponse(
        {
          error:
            "GEMINI_API_KEY is missing from Supabase Secrets.",
        },
        500
      );
    }

    // ─────────────────────────────────────────
    // Supabase keys
    // ─────────────────────────────────────────

    let publishableKey = "";
    let secretKey = "";

    if (publishableKeysRaw) {
      try {
        const keys = JSON.parse(
          publishableKeysRaw
        );
        publishableKey =
          keys?.default || "";
      } catch {
        console.error(
          "Could not parse SUPABASE_PUBLISHABLE_KEYS"
        );
      }
    }

    if (!publishableKey) {
      publishableKey =
        Deno.env.get(
          "SUPABASE_ANON_KEY"
        ) || "";
    }

    if (secretKeysRaw) {
      try {
        const keys = JSON.parse(
          secretKeysRaw
        );
        secretKey =
          keys?.default || "";
      } catch {
        console.error(
          "Could not parse SUPABASE_SECRET_KEYS"
        );
      }
    }

    if (!secretKey) {
      secretKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        ) || "";
    }

    if (!publishableKey) {
      return jsonResponse(
        {
          error:
            "Supabase publishable key is missing.",
        },
        500
      );
    }

    if (!secretKey) {
      return jsonResponse(
        {
          error:
            "Supabase secret key is missing.",
        },
        500
      );
    }

    // ─────────────────────────────────────────
    // Clients
    // ─────────────────────────────────────────

    const adminClient = createClient(
      supabaseUrl,
      secretKey
    );

    // ─────────────────────────────────────────
    // Request body
    // ─────────────────────────────────────────

    let body: any;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Invalid JSON request." },
        400
      );
    }

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const requestedSessionId =
      typeof body?.session_id === "string"
        ? body.session_id
        : null;

    const guestToken =
      typeof body?.guest_token === "string"
        ? body.guest_token
        : null;

    if (!message) {
      return jsonResponse(
        { error: "Message is required." },
        400
      );
    }

    // ─────────────────────────────────────────
    // Detect logged-in user
    // ─────────────────────────────────────────

    let userId: string | null = null;

    const authorization =
      req.headers.get("Authorization");

    if (
      authorization &&
      authorization.startsWith("Bearer ")
    ) {
      try {
        const userClient = createClient(
          supabaseUrl,
          publishableKey,
          {
            global: {
              headers: {
                Authorization: authorization,
              },
            },
          }
        );

        const {
          data: { user },
          error,
        } = await userClient.auth.getUser();

        if (!error && user) {
          userId = user.id;
        }
      } catch (authError) {
        console.error(
          "Auth check failed:",
          authError
        );
      }
    }

    const isGuest = !userId;

    console.log(
      "Chat request:",
      {
        loggedIn: !isGuest,
        userId,
        hasGuestToken: !!guestToken,
      }
    );

    // ─────────────────────────────────────────
    // Session
    // ─────────────────────────────────────────

    let sessionId =
      requestedSessionId;

    let isNewSession = false;

    if (!sessionId) {
      const sessionData: Record<
        string,
        string
      > = {};

      if (userId) {
        sessionData.user_id =
          userId;
      } else {
        sessionData.session_token =
          guestToken ||
          `guest_${crypto.randomUUID()}`;
      }

      const {
        data: newSession,
        error: sessionError,
      } = await adminClient
        .from("chat_sessions")
        .insert(sessionData)
        .select("id")
        .single();

      if (
        sessionError ||
        !newSession
      ) {
        console.error(
          "Session creation error:",
          sessionError
        );

        return jsonResponse(
          {
            error:
              `Failed to create chat session: ${
                sessionError?.message ||
                "unknown error"
              }`,
          },
          500
        );
      }

      sessionId =
        newSession.id;

      isNewSession = true;
    }

    // ─────────────────────────────────────────
    // Save user message
    // ─────────────────────────────────────────

    const {
      error: userMessageError,
    } = await adminClient
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: message,
      });

    if (userMessageError) {
      console.error(
        "User message save error:",
        userMessageError
      );

      return jsonResponse(
        {
          error:
            `Failed to save message: ${userMessageError.message}`,
        },
        500
      );
    }

    // ─────────────────────────────────────────
    // Load conversation
    // ─────────────────────────────────────────

    const {
      data: history,
      error: historyError,
    } = await adminClient
      .from("chat_messages")
      .select(
        "role, content, created_at"
      )
      .eq(
        "session_id",
        sessionId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(20);

    if (historyError) {
      console.error(
        "History error:",
        historyError
      );
    }

    const sortedHistory =
      (history || [])
        .reverse()
        .map((item: any) => ({
          role:
            item.role ===
            "assistant"
              ? "model"
              : "user",
          parts: [
            {
              text:
                String(
                  item.content || ""
                ),
            },
          ],
        }));

    // ─────────────────────────────────────────
    // Load opportunities
    // ─────────────────────────────────────────

    const {
      data: opportunities,
      error: opportunitiesError,
    } = await adminClient
      .from("opportunities")
      .select(
        "id, title, organization, category, education_level, field_of_study, deadline, short_description"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (opportunitiesError) {
      console.error(
        "Opportunities error:",
        opportunitiesError
      );

      return jsonResponse(
        {
          error:
            `Failed to load opportunities: ${opportunitiesError.message}`,
        },
        500
      );
    }

    // Filter expired opportunities here
    // instead of using "today" in the query.
    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const activeOpportunities =
      (opportunities || []).filter(
        (item: any) => {
          if (!item.deadline) {
            return true;
          }

          return (
            item.deadline >= today
          );
        }
      );

    const opportunityList =
      activeOpportunities.length > 0
        ? activeOpportunities
            .map(
              (
                item: any,
                index: number
              ) => {
                const education =
                  Array.isArray(
                    item.education_level
                  )
                    ? item.education_level.join(
                        ", "
                      )
                    : "any";

                const field =
                  Array.isArray(
                    item.field_of_study
                  )
                    ? item.field_of_study.join(
                        ", "
                      )
                    : "any";

                return [
                  `${index + 1}.`,
                  `Title: ${
                    item.title || "N/A"
                  }`,
                  `Organization: ${
                    item.organization ||
                    "N/A"
                  }`,
                  `Category: ${
                    item.category ||
                    "N/A"
                  }`,
                  `Education: ${education}`,
                  `Field: ${field}`,
                  `Deadline: ${
                    item.deadline ||
                    "Open"
                  }`,
                  `Description: ${
                    item.short_description ||
                    "N/A"
                  }`,
                ].join(" | ");
              }
            )
            .join("\n")
        : "(No active opportunities currently available.)";

    // ─────────────────────────────────────────
    // Gemini prompt
    // ─────────────────────────────────────────

    const systemInstruction =
      SYSTEM_INSTRUCTION.replace(
        "{OPPORTUNITIES_LIST}",
        opportunityList
      );

    // ─────────────────────────────────────────
    // Gemini API
    // ─────────────────────────────────────────

   const geminiUrl =
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
    geminiApiKey
  )}`;
    const geminiResponse =
      await fetch(
        geminiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    systemInstruction,
                },
              ],
            },
            contents:
              sortedHistory,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

    // ─────────────────────────────────────────
    // Gemini error
    // ─────────────────────────────────────────

    if (!geminiResponse.ok) {
      const errorText =
        await geminiResponse.text();

      console.error(
        "Gemini API error:",
        errorText
      );

      return jsonResponse(
        {
          error:
            "Gemini AI request failed.",
          details:
            errorText,
        },
        502
      );
    }

    // ─────────────────────────────────────────
    // Gemini response
    // ─────────────────────────────────────────

    const geminiData =
      await geminiResponse.json();

    const candidate =
      geminiData?.candidates?.[0];

    const assistantReply =
      candidate?.content?.parts
        ?.map(
          (part: any) =>
            part?.text || ""
        )
        .join("")
        .trim() || "";

    if (!assistantReply) {
      console.error(
        "Empty Gemini response:",
        JSON.stringify(
          geminiData
        )
      );

      return jsonResponse(
        {
          error:
            "Gemini returned an empty response.",
        },
        502
      );
    }

    // ─────────────────────────────────────────
    // Save assistant response
    // ─────────────────────────────────────────

    const {
      error: assistantMessageError,
    } = await adminClient
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantReply,
      });

    if (assistantMessageError) {
      console.error(
        "Assistant message save error:",
        assistantMessageError
      );
    }

    // ─────────────────────────────────────────
    // Return response
    // ─────────────────────────────────────────

    return jsonResponse({
      reply: assistantReply,
      session_id: sessionId,
      is_new_session:
        isNewSession,
    });
  } catch (error: any) {
    console.error(
      "chat-assistant fatal error:",
      error
    );

    return jsonResponse(
      {
        error:
          error?.message ||
          "Internal server error.",
      },
      500
    );
  }
});