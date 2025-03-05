/*
  # Create voice_models table

  1. New Tables
    - voice_models
      - id (uuid, primary key)
      - name (text)
      - provider (text)
      - language (text)
      - accent (text)
      - gender (text)
      - voice_id (text, unique)
      - preview_url (text)
      - active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for authenticated users to read active voice models

  3. Indexes
    - Active status
    - Language and accent
    - Voice ID
*/

-- Create voice_models table
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  language text NOT NULL,
  accent text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  voice_id text UNIQUE,
  preview_url text,
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

-- Insert default voice models
INSERT INTO voice_models (
  name, provider, language, accent, gender, 
  voice_id, preview_url, active
) VALUES 
  (
    'Aanya', 'ElevenLabs', 'hindi', 'neutral', 'female',
    'pNInz6obpgDQGcFmaJgB', 'https://api.elevenlabs.io/v1/voices/pNInz6obpgDQGcFmaJgB/preview',
    true
  ),
  (
    'Arjun', 'ElevenLabs', 'hindi', 'north_indian', 'male',
    'AZnzlk1XvdvUeBnXmlld', 'https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/preview',
    true
  ),
  (
    'Priya', 'ElevenLabs', 'hinglish', 'neutral', 'female',
    'EXAVITQu4vr4xnSDxMaL', 'https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
    true
  );

-- Create indexes for better performance
CREATE INDEX idx_voice_models_active ON voice_models(active);
CREATE INDEX idx_voice_models_language_accent ON voice_models(language, accent);
CREATE INDEX idx_voice_models_voice_id ON voice_models(voice_id);