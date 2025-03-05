/*
  # Add AI Calling Agent Configuration

  1. New Tables
    - `voice_configurations`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `language` (voice_language)
      - `accent` (voice_accent)
      - `voice_model_id` (uuid, references voice_models)
      - `speaking_rate` (float)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add voice_type to projects table
    - Add voice configuration options

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create enum types for voice configuration
CREATE TYPE voice_language AS ENUM (
  'hindi', 'english', 'hinglish'
);

CREATE TYPE voice_accent AS ENUM (
  'north_indian', 'south_indian', 'neutral', 'british_indian', 'american_indian'
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

-- Add voice_type to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_type text CHECK (voice_type IN ('chatbot', 'calling_agent'));

-- Enable RLS
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_configurations ENABLE ROW LEVEL SECURITY;

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

-- Create triggers for updated_at columns
CREATE TRIGGER update_voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_configurations_updated_at
  BEFORE UPDATE ON voice_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice models
INSERT INTO voice_models (name, provider, language, accent, gender, sample_url) VALUES
  ('Aditi', 'Amazon Polly', 'hindi', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/aditi-sample.mp3'),
  ('Raveena', 'Amazon Polly', 'hindi', 'neutral', 'female', 'https://samples.ekaksh.ai/voices/raveena-sample.mp3'),
  ('Kajal', 'Amazon Polly', 'hinglish', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/kajal-sample.mp3'),
  ('Kabir', 'Amazon Polly', 'hindi', 'neutral', 'male', 'https://samples.ekaksh.ai/voices/kabir-sample.mp3');

-- Add indexes for better performance
CREATE INDEX idx_voice_models_active ON voice_models(active);
CREATE INDEX idx_voice_models_language_accent ON voice_models(language, accent);
CREATE INDEX idx_voice_configurations_project ON voice_configurations(project_id);