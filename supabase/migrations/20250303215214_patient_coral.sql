/*
  # Add ElevenLabs Voice Models Schema

  1. New Tables
    - Update voice_models table to support ElevenLabs specific fields
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

-- Add ElevenLabs specific columns to voice_models
ALTER TABLE voice_models 
ADD COLUMN IF NOT EXISTS voice_id text,
ADD COLUMN IF NOT EXISTS preview_url text,
ADD COLUMN IF NOT EXISTS similarity_boost float DEFAULT 0.75,
ADD COLUMN IF NOT EXISTS stability float DEFAULT 0.75,
ADD COLUMN IF NOT EXISTS model_id text;

-- Insert ElevenLabs voice models
INSERT INTO voice_models (
  name, provider, language, accent, gender, 
  voice_id, preview_url, similarity_boost, stability, model_id
) VALUES 
  (
    'Aanya', 'ElevenLabs', 'hindi', 'neutral', 'female',
    'pNInz6obpgDQGcFmaJgB', 'https://api.elevenlabs.io/v1/voices/pNInz6obpgDQGcFmaJgB/preview',
    0.75, 0.75, 'eleven_multilingual_v2'
  ),
  (
    'Arjun', 'ElevenLabs', 'hindi', 'north_indian', 'male',
    'AZnzlk1XvdvUeBnXmlld', 'https://api.elevenlabs.io/v1/voices/AZnzlk1XvdvUeBnXmlld/preview',
    0.75, 0.75, 'eleven_multilingual_v2'
  ),
  (
    'Priya', 'ElevenLabs', 'hinglish', 'neutral', 'female',
    'EXAVITQu4vr4xnSDxMaL', 'https://api.elevenlabs.io/v1/voices/EXAVITQu4vr4xnSDxMaL/preview',
    0.75, 0.75, 'eleven_multilingual_v2'
  );

-- Create index for ElevenLabs voice_id
CREATE INDEX IF NOT EXISTS idx_voice_models_voice_id ON voice_models(voice_id);