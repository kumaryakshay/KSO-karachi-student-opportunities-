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
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type":
          "application/json",
      },
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: CORS_HEADERS,
    });
  }

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    const serperApiKey =
      Deno.env.get(
        "SERPER_API_KEY"
      );

    if (!supabaseUrl) {
      return jsonResponse(
        {
          error:
            "SUPABASE_URL is missing.",
        },
        500
      );
    }

    if (!serviceRoleKey) {
      return jsonResponse(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing.",
        },
        500
      );
    }

    if (!serperApiKey) {
      return jsonResponse(
        {
          error:
            "SERPER_API_KEY is missing.",
        },
        500
      );
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey
      );

    const searches = [
      "Karachi scholarships students Pakistan 2026",
      "Karachi internships students 2026",
      "Karachi competitions students 2026",
      "Karachi fellowships students 2026",
      "Karachi courses students 2026",
      "Karachi training programs students 2026",
      "Pakistan scholarships students 2026",
      "Pakistan internships students 2026",
      "online internships Pakistan students 2026",
      "online courses students Pakistan 2026",
    ];

    let allResults: any[] = [];

    for (const query of searches) {
      const response =
        await fetch(
          "https://google.serper.dev/search",
          {
            method: "POST",
            headers: {
              "X-API-KEY":
                serperApiKey,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              q: query,
              gl: "pk",
              hl: "en",
              num: 10,
            }),
          }
        );

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Serper error:",
          errorText
        );

        continue;
      }

      const result =
        await response.json();

      if (
        Array.isArray(
          result.organic
        )
      ) {
        allResults =
          allResults.concat(
            result.organic
          );
      }
    }

    // Remove duplicate URLs
    const uniqueResults =
      Array.from(
        new Map(
          allResults
            .filter(
              (item) =>
                item?.link
            )
            .map(
              (item) => [
                item.link,
                item,
              ]
            )
        ).values()
      );

    let inserted = 0;

    for (const item of uniqueResults) {
      const title =
        String(
          item.title || ""
        ).trim();

      const sourceUrl =
        String(
          item.link || ""
        ).trim();

      const description =
        String(
          item.snippet || ""
        ).trim();

      if (
        !title ||
        !sourceUrl
      ) {
        continue;
      }

      // Simple category detection
      const text =
        `${title} ${description}`
          .toLowerCase();

      let category =
        "other";

      if (
        text.includes(
          "scholarship"
        )
      ) {
        category =
          "scholarship";
      } else if (
        text.includes(
          "internship"
        )
      ) {
        category =
          "internship";
      } else if (
        text.includes(
          "fellowship"
        )
      ) {
        category =
          "fellowship";
      } else if (
        text.includes(
          "competition"
        ) ||
        text.includes(
          "challenge"
        )
      ) {
        category =
          "competition";
      } else if (
        text.includes(
          "course"
        ) ||
        text.includes(
          "certificate"
        )
      ) {
        category =
          "course";
      } else if (
        text.includes(
          "training"
        ) ||
        text.includes(
          "bootcamp"
        )
      ) {
        category =
          "training";
      } else if (
        text.includes(
          "job"
        )
      ) {
        category =
          "job";
      }

      // Karachi priority
      const isKarachi =
        text.includes(
          "karachi"
        );

      // Try to find existing record
      const {
        data: existing,
      } =
        await supabase
          .from(
            "opportunities"
          )
          .select("id")
          .eq(
            "source_url",
            sourceUrl
          )
          .limit(1);

      if (
        existing &&
        existing.length > 0
      ) {
        continue;
      }

      const {
        error: insertError,
      } =
        await supabase
          .from(
            "opportunities"
          )
          .insert({
            title,
            organization:
              item.link
                ? new URL(
                    sourceUrl
                  ).hostname
                : "Unknown",

            category,

            short_description:
              description,

            description,

            location:
              isKarachi
                ? "Karachi, Pakistan"
                : "Pakistan / Online",

            source_url:
              sourceUrl,

            application_url:
              sourceUrl,

            is_remote:
              text.includes(
                "online"
              ) ||
              text.includes(
                "remote"
              ),

            is_featured:
              isKarachi,

            is_demo_data:
              false,
          });

      if (insertError) {
        console.error(
          "Insert error:",
          insertError
        );
        continue;
      }

      inserted++;
    }

    return jsonResponse({
      success: true,
      searched:
        searches.length,
      searchResults:
        uniqueResults.length,
      inserted,
    });
  } catch (error: any) {
    console.error(
      "sync-opportunities error:",
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