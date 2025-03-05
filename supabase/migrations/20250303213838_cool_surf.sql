/*
  # Add Voice Agent Support

  1. New Tables
    - `voice_models`: Stores available voice models with language and accent options
    - `voice_configurations`: Project-specific voice settings
    - `call_campaigns`: Manages outbound calling campaigns
    - `call_targets`: Stores contact information for calls
    - `call_records`: Records call history and outcomes

  2. Schema Updates
    - Add voice_type to projects table
    - Add voice-related enums for languages and accents

  3. Security
    - Enable RLS on all new tables
    - Add policies for voice-related tables
*/

-- Create enum types for voice configuration
CREATE TYPE voice_language AS ENUM (
  'hindi', 'english', 'hinglish'
);

CREATE TYPE voice_accent AS ENUM (
  'north_indian', 'south_indian', 'neutral', 'british_indian', 'american_indian'
);

CREATE TYPE call_status AS ENUM (
  'pending', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'scheduled'
);

-- Create voice_models table
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  language voice_language NOT NULL,
  accent voice_accent NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  sample_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create voice_configurations table
CREATE TABLE IF NOT EXISTS voice_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  language voice_language NOT NULL DEFAULT 'english',
  accent voice_accent NOT NULL DEFAULT 'neutral',
  voice_model_id uuid REFERENCES voice_models(id),
  speaking_rate float DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

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
  status call_status DEFAULT 'pending',
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

-- Add voice_type to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_type text CHECK (voice_type IN ('chatbot', 'calling_agent'));

-- Enable RLS
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;

-- Create policies for voice_models
CREATE POLICY "Anyone can read active voice models"
  ON voice_models
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create policies for voice_configurations
CREATE POLICY "Users can manage their voice configurations"
  ON voice_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = voice_configurations.project_id
      AND projects.user_id = auth.uid()
    )
  );

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
CREATE TRIGGER update_voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_configurations_updated_at
  BEFORE UPDATE ON voice_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Insert default voice models
INSERT INTO voice_models (name, provider, language, accent, gender, sample_url) VALUES
  ('Aditi', 'Amazon Polly', 'hindi', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/aditi-sample.mp3'),
  ('Raveena', 'Amazon Polly', 'hindi', 'neutral', 'female', 'https://samples.ekaksh.ai/voices/raveena-sample.mp3'),
  ('Kajal', 'Amazon Polly', 'hinglish', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/kajal-sample.mp3'),
  ('Kabir', 'Amazon Polly', 'hindi', 'neutral', 'male', 'https://samples.ekaksh.ai/voices/kabir-sample.mp3');

-- Create indexes for better performance
CREATE INDEX idx_voice_models_active ON voice_models(active);
CREATE INDEX idx_voice_models_language_accent ON voice_models(language, accent);
CREATE INDEX idx_voice_configurations_project ON voice_configurations(project_id);
CREATE INDEX idx_call_targets_campaign_status ON call_targets(campaign_id, status);
CREATE INDEX idx_call_records_campaign_id ON call_records(campaign_id);
CREATE INDEX idx_call_targets_phone ON call_targets(phone_number);
CREATE INDEX idx_campaigns_project_status ON call_campaigns(project_id, status);