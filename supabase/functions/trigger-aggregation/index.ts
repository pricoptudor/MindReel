// Supabase Edge Function: trigger-aggregation
// Called by pg_cron to trigger the Python aggregation service.
//
// Deploy: supabase functions deploy trigger-aggregation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AGGREGATOR_URL = Deno.env.get("AGGREGATOR_URL") || "http://localhost:8000";

serve(async (req) => {
  try {
    // Parse optional body for selective aggregation
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Default: aggregate all sources
    }

    console.log(`Triggering aggregation: ${JSON.stringify(body)}`);

    const response = await fetch(`${AGGREGATOR_URL}/aggregate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_items_per_source: body.max_items_per_source || 20,
        source_types: body.source_types || null,
        interest_ids: body.interest_ids || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Aggregator error: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Aggregator returned ${response.status}`, details: errorText }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const results = await response.json();
    console.log(`Aggregation complete:`, JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`Trigger error: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
