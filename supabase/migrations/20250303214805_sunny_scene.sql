/*
  # Add Voice Models Schema

  1. New Tables
    - `voice_models`
      - `id` (uuid, primary key)
      - `name` (text)
      - `provider` (text)
      - `language` (text)
      - `accent` (text)
      - `gender` (text)
      - `sample_url` (text)
      - `active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `voice_models` table
    - Add policy for authenticated users to read active voice models

  3. Data
    - Insert default voice models for different languages and accents
*/

-- Create voice_models table
CREATE TABLE IF NOT EXISTS voice_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  language text NOT NULL,
  accent text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female')),
  sample_url text,
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
INSERT INTO voice_models (name, provider, language, accent, gender, sample_url) VALUES
  ('Aditi', 'Amazon Polly', 'hindi', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/aditi-sample.mp3'),
  ('Raveena', 'Amazon Polly', 'hindi', 'neutral', 'female', 'https://samples.ekaksh.ai/voices/raveena-sample.mp3'),
  ('Kajal', 'Amazon Polly', 'hinglish', 'north_indian', 'female', 'https://samples.ekaksh.ai/voices/kajal-sample.mp3'),
  ('Kabir', 'Amazon Polly', 'hindi', 'neutral', 'male', 'https://samples.ekaksh.ai/voices/kabir-sample.mp3'),
  ('Isha', 'Google Cloud TTS', 'hindi', 'neutral', 'female', 'https://samples.ekaksh.ai/voices/isha-sample.mp3'),
  ('Arjun', 'Google Cloud TTS', 'hindi', 'north_indian', 'male', 'https://samples.ekaksh.ai/voices/arjun-sample.mp3'),
  ('Priya', 'Microsoft Azure', 'hindi', 'neutral', 'female', 'https://samples.ekaksh.ai/voices/priya-sample.mp3'),
  ('Raj', 'Microsoft Azure', 'hinglish', 'neutral', 'male', 'https://samples.ekaksh.ai/voices/raj-sample.mp3');

-- Create index for better performance
CREATE INDEX idx_voice_models_active ON voice_models(active);
CREATE INDEX idx_voice_models_language_accent ON voice_models(language, accent);