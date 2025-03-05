/*
  # Create knowledge sources table

  1. New Tables
    - `knowledge_sources`
      - `id` (uuid, primary key)
      - `project_id` (uuid, not null, references projects)
      - `name` (text, not null)
      - `type` (text, not null) - document, website, custom
      - `content` (text) - for custom knowledge
      - `url` (text) - for website sources
      - `file_path` (text) - for document sources
      - `status` (text, not null) - pending, processing, processed, error
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
  2. Security
    - Enable RLS on `knowledge_sources` table
    - Add policy for authenticated users to read their own knowledge sources
    - Add policy for authenticated users to insert their own knowledge sources
    - Add policy for authenticated users to update their own knowledge sources
    - Add policy for authenticated users to delete their own knowledge sources
*/

CREATE TABLE IF NOT EXISTS knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('document', 'website', 'custom')),
  content text,
  url text,
  file_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own knowledge sources
CREATE POLICY "Users can read their own knowledge sources"
  ON knowledge_sources
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own knowledge sources
CREATE POLICY "Users can insert their own knowledge sources"
  ON knowledge_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own knowledge sources
CREATE POLICY "Users can update their own knowledge sources"
  ON knowledge_sources
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own knowledge sources
CREATE POLICY "Users can delete their own knowledge sources"
  ON knowledge_sources
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = knowledge_sources.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_knowledge_sources_updated_at
BEFORE UPDATE ON knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();