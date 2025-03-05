/*
  # Add voice_type column to projects table

  1. Changes
    - Add voice_type column to projects table
    - Set default value for existing rows
    - Add check constraint for valid values

  2. Notes
    - Non-destructive migration that preserves existing data
    - Adds validation for voice_type values
*/

-- Add voice_type column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'voice_type'
  ) THEN
    -- Add the column
    ALTER TABLE projects 
    ADD COLUMN voice_type text;

    -- Set default value for existing rows
    UPDATE projects 
    SET voice_type = 'chatbot' 
    WHERE voice_type IS NULL;

    -- Add check constraint
    ALTER TABLE projects 
    ADD CONSTRAINT projects_voice_type_check 
    CHECK (voice_type IN ('chatbot', 'calling_agent'));

    -- Set default for new rows
    ALTER TABLE projects 
    ALTER COLUMN voice_type 
    SET DEFAULT 'chatbot';
  END IF;
END $$;