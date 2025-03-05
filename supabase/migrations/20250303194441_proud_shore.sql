/*
  # Add URL Processing Support

  1. New Tables
    - `processing_queue`
      - `id` (uuid, primary key)
      - `knowledge_source_id` (uuid, references knowledge_sources)
      - `status` (text)
      - `attempts` (integer)
      - `last_attempt` (timestamptz)
      - `error` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Add `last_processed` column to knowledge_sources
    - Add `error_message` column to knowledge_sources
    
  3. Security
    - Enable RLS on processing_queue
    - Add policies for authenticated users
*/

-- Add last_processed and error_message columns to knowledge_sources
ALTER TABLE knowledge_sources 
ADD COLUMN IF NOT EXISTS last_processed timestamptz,
ADD COLUMN IF NOT EXISTS error_message text;

-- Create processing queue table
CREATE TABLE IF NOT EXISTS processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_attempt timestamptz,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE processing_queue ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own processing queue items
CREATE POLICY "Users can read their own processing queue items"
  ON processing_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_sources
      JOIN projects ON projects.id = knowledge_sources.project_id
      WHERE knowledge_sources.id = processing_queue.knowledge_source_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_processing_queue_updated_at
  BEFORE UPDATE ON processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create processing queue entry
CREATE OR REPLACE FUNCTION create_processing_queue_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'website' AND NEW.status = 'pending' THEN
    INSERT INTO processing_queue (knowledge_source_id, status)
    VALUES (NEW.id, 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create processing queue entry
CREATE TRIGGER create_processing_queue_entry_trigger
  AFTER INSERT ON knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION create_processing_queue_entry();