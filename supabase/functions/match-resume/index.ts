/**
 * KSO Supabase Edge Function: match-resume
 * =========================================
 * Receives the authenticated user's ID, fetches their resume from storage,
 * queries active opportunities, then sends both to Google Gemini 2.5 Flash
 * for AI-powered matching.
 *
 * Deploy with:  npx supabase functions deploy match-resume
 * Set secret:   npx supabase secrets set GEMINI_API_KEY=your-key
 *
 * Deno runtime (Supabase Edge Functions).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS Headers ────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ── Main Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // 1. Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return jsonResponse(
        { error: "GEMINI_API_KEY secret is not configured on Supabase" },
        500
      );
    }

    // Auth client (user-scoped via JWT)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client (bypasses RLS — for storage access)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "Not authenticated" }, 401);
    }

    // 2. Get user's resume path from profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("resume_url")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.resume_url) {
      return jsonResponse(
        { error: "No resume uploaded. Please upload your resume in Profile first." },
        400
      );
    }

    // 3. Download the resume PDF from Storage
    const resumePath = profile.resume_url; // e.g. "resumes/userId/123_resume.pdf"
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("resumes")
      .download(resumePath);

    if (downloadError || !fileData) {
      return jsonResponse({ error: "Failed to download resume file" }, 500);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Resume = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    // 4. Fetch active opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from("opportunities")
      .select(
        "id, title, organization, category, eligibility, education_level, field_of_study, deadline, short_description"
      )
      .or("deadline.is.null,deadline.gte.today")
      .order("created_at", { ascending: false });

    if (oppError || !opportunities) {
      return jsonResponse({ error: "Failed to fetch opportunities" }, 500);
    }

    // 5. Build the Gemini prompt
    const oppListText = opportunities
      .map(
        (o: any, i: number) =>
          `${i + 1}. [ID: ${o.id}] "${o.title}" by ${o.organization} — ` +
          `Category: ${o.category}, Education: ${(o.education_level || []).join(", ") || "any"}, ` +
          `Field: ${(o.field_of_study || []).join(", ") || "any"}, ` +
          `Eligibility: ${(o.eligibility || []).join(", ") || "any"}, ` +
          `Deadline: ${o.deadline || "open"}`
      )
      .join("\n");

    const prompt = `You are an expert career advisor for students and fresh graduates in Pakistan.

Analyze the attached PDF resume and match the candidate against the following ${opportunities.length} opportunities.

RULES:
- Only recommend opportunities from the provided list. Use the exact opportunity_id from the list.
- Evaluate based on the candidate's education, skills, experience, field of study, and career stage.
- Rank matches by relevance (best matches first).
- Provide a concise reason (1-2 sentences) for each match explaining why it's a good fit.
- Include 2-4 resume improvement tips specific to this candidate's profile and the Pakistani job market.

OPPORTUNITIES LIST:
${oppListText}

Respond in STRICT JSON only — no markdown fences, no preamble, no explanation outside JSON:
{
  "matches": [
    { "opportunity_id": "uuid-from-list", "reason": "Brief reason why this is a match" }
  ],
  "resume_feedback": [
    "Actionable tip to improve the resume"
  ]
}`;

    // 6. Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Resume,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", errorBody);
      return jsonResponse(
        { error: `Gemini API returned ${geminiResponse.status}` },
        502
      );
    }

    const geminiData = await geminiResponse.json();

    // 7. Extract and parse the response text
    const candidate = geminiData?.candidates?.[0];
    const rawText =
      candidate?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return jsonResponse(
        { error: "Gemini returned empty response" },
        502
      );
    }

    const cleaned = stripMarkdownFences(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return jsonResponse(
        { error: "Gemini returned invalid JSON", raw: rawText },
        502
      );
    }

    // 8. Validate matches reference valid opportunity IDs
    const validIds = new Set(opportunities.map((o: any) => o.id));
    if (Array.isArray(parsed.matches)) {
      parsed.matches = parsed.matches.filter((m: any) =>
        validIds.has(m.opportunity_id)
      );
    }

    return jsonResponse({
      matches: parsed.matches || [],
      resume_feedback: parsed.resume_feedback || [],
      opportunities_count: opportunities.length,
    });
  } catch (err: any) {
    console.error("Edge function error:", err);
    return jsonResponse(
      { error: err.message || "Internal server error" },
      500
    );
  }
});
