/*
  # Add Teams Link to App Config

  ## Summary
  Inserts a default empty entry for the monthly mentorship meeting Teams link
  into the app_config table, so admins can configure it from the Settings page.

  ## New Config Keys
  - `wts_teams_link`: URL for the monthly mentorship meeting (Teams/Zoom/etc.)
*/

INSERT INTO app_config (key, value)
VALUES ('wts_teams_link', '')
ON CONFLICT (key) DO NOTHING;
