/*
  # Add AI Calling Agent Support

  1. New Tables
    - `voice_models` - Stores available voice models and their capabilities
      - `id` (uuid, primary key)
      - `name` (text) - Model name
      - `provider` (text) - Voice provider name
      - `language` (text) - Supported language
      - `accent` (text) - Supported accent
      - `gender` (text) - Voice gender
      - `capabilities` (jsonb) - Model capabilities and features
      - `active` (boolean) - Whether model is currently available

    - `voice_settings` - Project-specific voice settings
      - `id` (uuid, primary key)
      - `project_id` (uuid) - Reference to projects table
      - `voice_model_id` (uuid) - Reference to voice_models table
      - `language` (text) - Selected language
      - `accent` (text) - Selected accent
      - `speaking_rate` (float) - Speech rate adjustment
      - `pitch` (float) - Voice pitch adjustment
      - `volume_gain_db` (float) - Volume adjustment in decibels

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their voice settings
    - Add policies for reading available voice models

  3. Changes
    - Add voice_type field to projects table
    - Add voice-related fields to user_settings
*/

-- Create voice_models table
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  language text NOT NULL,
  accent text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  capabilities jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create voice_settings table
CREATE TABLE IF NOT EXISTS voice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voice_model_id uuid NOT NULL REFERENCES voice_models(id),
  language text NOT NULL,
  accent text NOT NULL,
  speaking_rate float DEFAULT 1.0,
  pitch float DEFAULT 0.0,
  volume_gain_db float DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

-- Add voice_type to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_type text CHECK (voice_type IN ('chatbot', 'calling_agent'));

-- Enable RLS
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_settings ENABLE ROW LEVEL SECURITY;

-- Policies for voice_models
CREATE POLICY "Anyone can read active voice models"
  ON voice_models
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Policies for voice_settings
CREATE POLICY "Users can manage their voice settings"
  ON voice_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = voice_settings.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create triggers for updated_at columns
CREATE TRIGGER update_voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_settings_updated_at
  BEFORE UPDATE ON voice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default voice models
INSERT INTO voice_models (name, provider, language, accent, gender, capabilities) VALUES
  ('Aditi', 'Amazon Polly', 'hindi', 'north_indian', 'female', '{"neural": true, "conversational": true}'),
  ('Raveena', 'Amazon Polly', 'hindi', 'neutral', 'female', '{"neural": true, "conversational": true}'),
  ('Kajal', 'Amazon Polly', 'hinglish', 'north_indian', 'female', '{"neural": true, "conversational": true}'),
  ('Kabir', 'Amazon Polly', 'hindi', 'neutral', 'male', '{"neural": true, "conversational": true}'),
  ('Isha', 'Google Cloud TTS', 'hindi', 'neutral', 'female', '{"neural": true, "conversational": true, "multilingual": true}'),
  ('Arjun', 'Google Cloud TTS', 'hindi', 'north_indian', 'male', '{"neural": true, "conversational": true, "multilingual": true}'),
  ('Priya', 'Microsoft Azure', 'hindi', 'neutral', 'female', '{"neural": true, "conversational": true, "style_control": true}'),
  ('Raj', 'Microsoft Azure', 'hinglish', 'neutral', 'male', '{"neural": true, "conversational": true, "style_control": true}');

-- Add indexes for better performance
CREATE INDEX idx_voice_models_active ON voice_models(active);
CREATE INDEX idx_voice_models_language_accent ON voice_models(language, accent);
CREATE INDEX idx_voice_settings_project ON voice_settings(project_id);