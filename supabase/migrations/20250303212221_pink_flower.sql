/*
  # AI Calling Agent Setup

  1. New Tables
    - `calling_campaigns`
      - Campaign configuration and status tracking
      - Supports Hindi and English languages
      - Regional accent preferences
    - `call_targets`
      - Phone numbers and contact details from uploaded files
      - Call scheduling and status tracking
    - `call_records`
      - Detailed call logs and summaries
      - Voice recording references
      - Call transcripts and analysis

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types for call statuses and languages
CREATE TYPE call_status AS ENUM (
  'pending', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'scheduled'
);

CREATE TYPE campaign_status AS ENUM (
  'draft', 'active', 'paused', 'completed', 'cancelled'
);

CREATE TYPE voice_language AS ENUM (
  'hindi', 'english', 'hinglish'
);

CREATE TYPE voice_accent AS ENUM (
  'north_indian', 'south_indian', 'neutral', 'british_indian', 'american_indian'
);

-- Calling campaigns table
CREATE TABLE IF NOT EXISTS calling_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  script text NOT NULL,
  language voice_language NOT NULL DEFAULT 'english',
  accent voice_accent NOT NULL DEFAULT 'neutral',
  status campaign_status NOT NULL DEFAULT 'draft',
  start_date timestamptz,
  end_date timestamptz,
  daily_call_limit integer DEFAULT 100,
  retry_attempts integer DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Call targets table (from uploaded files)
CREATE TABLE IF NOT EXISTS call_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES calling_campaigns(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  name text,
  company text,
  email text,
  additional_data jsonb DEFAULT '{}'::jsonb,
  priority integer DEFAULT 0,
  status call_status DEFAULT 'pending',
  scheduled_time timestamptz,
  attempts integer DEFAULT 0,
  last_attempt timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, phone_number)
);

-- Call records table
CREATE TABLE IF NOT EXISTS call_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES calling_campaigns(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES call_targets(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration interval,
  status call_status NOT NULL,
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
ALTER TABLE calling_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calling_campaigns
CREATE POLICY "Users can manage their own campaigns"
  ON calling_campaigns
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = calling_campaigns.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for call_targets
CREATE POLICY "Users can manage their campaign targets"
  ON call_targets
  USING (
    EXISTS (
      SELECT 1 FROM calling_campaigns
      JOIN projects ON projects.id = calling_campaigns.project_id
      WHERE calling_campaigns.id = call_targets.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for call_records
CREATE POLICY "Users can manage their call records"
  ON call_records
  USING (
    EXISTS (
      SELECT 1 FROM calling_campaigns
      JOIN projects ON projects.id = calling_campaigns.project_id
      WHERE calling_campaigns.id = call_records.campaign_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_calling_campaigns_updated_at
  BEFORE UPDATE ON calling_campaigns
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
CREATE INDEX idx_campaigns_project_status ON calling_campaigns(project_id, status);