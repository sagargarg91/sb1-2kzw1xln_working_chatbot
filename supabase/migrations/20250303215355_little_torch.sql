/*
  # Voice Models Schema Setup

  1. New Tables
    - voice_models table for storing voice configuration
      - Add voice_id for ElevenLabs unique identifier
      - Add preview_url for voice samples
      - Add similarity_boost and stability settings
      - Add model_id for ElevenLabs model selection

  2. Security
    - Enable RLS on voice_models table
    - Add policy for authenticated users to read active voice models

  3. Data
    - Insert default ElevenLabs voice models
*/

-- Create voice_models table
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  language text NOT NULL,
  accent text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  voice_id text,
  preview_url text,
  similarity_boost float DEFAULT 0.75,
  stability float DEFAULT 0.75,
  model_id text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read active voice models
CREATE POLICY "Anyone can read active voice models"
  ON voice_models
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Create trigger to update updated_at column
CREATE TRIGGER update_voice_models_updated_at
  BEFORE UPDATE ON voice_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert ElevenLabs voice models
INSERT INTO voice_models (
  name, provider, language, accent, gender, 
  voice_id, preview_url, similarity_boost, stability, model_id,
  active
) VALUES 
  (
    'Aanya', 'ElevenLabs', 'hindi', 'neutral', 'female',
    'pNInz6obpgDQGcFmaJgB', 'https://api.elevenlabs.io/v1/voices/pNInz6obpgDQGcFmaJgB/preview',
    0.75, 0.75, 'eleven_multilingual_v2',
    true
  ),
  (
    'Arjun', 'ElevenLabs', 'hindi', 'north_indian', 'male',
    'AZnzlk1XvdvUeBnXmlld', 'https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/preview',
    0.75, 0.75, 'eleven_multilingual_v2',
    true
  ),
  (
    'Priya', 'ElevenLabs', 'hinglish', 'neutral', 'female',
    'EXAVITQu4vr4xnSDxMaL', 'https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
    0.75, 0.75, 'eleven_multilingual_v2',
    true
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_models_active ON voice_models(active);
CREATE INDEX IF NOT EXISTS idx_voice_models_language_accent ON voice_models(language, accent);
CREATE INDEX IF NOT EXISTS idx_voice_models_voice_id ON voice_models(voice_id);