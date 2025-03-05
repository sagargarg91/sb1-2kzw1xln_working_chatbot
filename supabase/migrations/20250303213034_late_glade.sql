/*
  # Add AI Calling Agent Support

  1. New Tables
    - `call_campaigns` - Stores calling campaign configurations
      - `id` (uuid, primary key)
      - `project_id` (uuid) - Reference to projects table
      - `name` (text) - Campaign name
      - `description` (text) - Campaign description
      - `script` (text) - Call script template
      - `status` (text) - Campaign status (draft, active, paused, completed)
      - `start_date` (timestamptz) - Campaign start date
      - `end_date` (timestamptz) - Campaign end date
      - `daily_call_limit` (integer) - Maximum calls per day
      - `retry_attempts` (integer) - Number of retry attempts for failed calls

    - `call_targets` - Stores phone numbers to call
      - `id` (uuid, primary key)
      - `campaign_id` (uuid) - Reference to call_campaigns table
      - `phone_number` (text) - Target phone number
      - `name` (text) - Contact name
      - `company` (text) - Company name
      - `status` (text) - Call status (pending, completed, failed, etc.)
      - `attempts` (integer) - Number of call attempts made
      - `last_attempt` (timestamptz) - Last call attempt timestamp

    - `call_records` - Stores individual call details
      - `id` (uuid, primary key)
      - `campaign_id` (uuid) - Reference to call_campaigns table
      - `target_id` (uuid) - Reference to call_targets table
      - `start_time` (timestamptz) - Call start time
      - `end_time` (timestamptz) - Call end time
      - `duration` (interval) - Call duration
      - `recording_url` (text) - Call recording URL
      - `transcript` (text) - Call transcript
      - `summary` (text) - AI-generated call summary
      - `sentiment` (text) - Call sentiment analysis
      - `next_action` (text) - Recommended next action

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their campaigns and calls
    - Add indexes for better performance

  3. Changes
    - Add call-related fields to projects table
*/

-- Create call_campaigns table
CREATE TABLE IF NOT EXISTS call_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  script text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  start_date timestamptz,
  end_date timestamptz,
  daily_call_limit integer DEFAULT 100,
  retry_attempts integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create call_targets table
CREATE TABLE IF NOT EXISTS call_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES call_campaigns(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  name text,
  company text,
  email text,
  additional_data jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'no_answer')),
  attempts integer DEFAULT 0,
  last_attempt timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, phone_number)
);

-- Create call_records table
CREATE TABLE IF NOT EXISTS call_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES call_campaigns(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES call_targets(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration interval,
  recording_url text,
  transcript text,
  summary text,
  sentiment text,
  next_action text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- Create policies for call_campaigns
CREATE POLICY "Users can manage their own campaigns"
  ON call_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = call_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policies for call_targets
CREATE POLICY "Users can manage their campaign targets"
  ON call_targets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM call_campaigns
      JOIN projects ON projects.id = call_campaigns.project_id
      WHERE call_campaigns.id = call_targets.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policies for call_records
CREATE POLICY "Users can manage their call records"
  ON call_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM call_campaigns
      JOIN projects ON projects.id = call_campaigns.project_id
      WHERE call_campaigns.id = call_records.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_call_campaigns_updated_at
  BEFORE UPDATE ON call_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_targets_updated_at
  BEFORE UPDATE ON call_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_call_records_updated_at
  BEFORE UPDATE ON call_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_call_targets_campaign_status ON call_targets(campaign_id, status);
CREATE INDEX idx_call_records_campaign_id ON call_records(campaign_id);
CREATE INDEX idx_call_targets_phone ON call_targets(phone_number);
CREATE INDEX idx_campaigns_project_status ON call_campaigns(project_id, status);

-- Add call-related fields to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_provider text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_settings jsonb DEFAULT '{}'::jsonb;