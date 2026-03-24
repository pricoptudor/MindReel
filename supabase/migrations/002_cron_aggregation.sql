-- Enable required extensions for scheduled aggregation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Cron job: Trigger content aggregation every 6 hours
-- ============================================================
-- Adjust the schedule and URL to match your deployment.
-- The Edge Function will call the Python aggregation service.
--
-- To set this up, replace:
--   - YOUR_PROJECT_REF with your Supabase project reference
--   - YOUR_ANON_KEY with your Supabase anon key
--
-- Run this in the Supabase SQL editor after deploying the Edge Function.

/*
SELECT cron.schedule(
  'mindreel-aggregate-all',
  '0 */6 * * *',  -- Every 6 hours
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/trigger-aggregation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'max_items_per_source', 20
    )
  ) AS request_id;
  $$
);
*/

-- ============================================================
-- Optional: More frequent cron for specific fast sources
-- ============================================================
/*
SELECT cron.schedule(
  'mindreel-aggregate-fast',
  '0 */2 * * *',  -- Every 2 hours
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/trigger-aggregation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_ANON_KEY'
    ),
    body := jsonb_build_object(
      'source_types', '["hackernews", "rss"]'::jsonb,
      'max_items_per_source', 15
    )
  ) AS request_id;
  $$
);
*/

-- ============================================================
-- Manage cron jobs
-- ============================================================
-- List all jobs:    SELECT * FROM cron.job;
-- Disable a job:    SELECT cron.unschedule('mindreel-aggregate-all');
-- View run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
