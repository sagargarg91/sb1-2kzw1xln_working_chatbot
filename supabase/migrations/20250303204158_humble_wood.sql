/*
  # Add e-commerce training data tables

  1. New Tables
    - `training_data`
      - Stores custom training examples for e-commerce scenarios
      - Links to specific data types (products, orders, refunds)
      - Includes example questions and ideal responses

  2. Security
    - Enable RLS on training_data table
    - Add policies for authenticated users
*/

-- Create training data table
CREATE TABLE IF NOT EXISTS training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data_type text NOT NULL CHECK (data_type IN ('product', 'order', 'refund', 'general')),
  example_question text NOT NULL,
  ideal_response text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own training data
CREATE POLICY "Users can read their own training data"
  ON training_data
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = training_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to insert their own training data
CREATE POLICY "Users can insert their own training data"
  ON training_data
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = training_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to update their own training data
CREATE POLICY "Users can update their own training data"
  ON training_data
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = training_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create policy to allow users to delete their own training data
CREATE POLICY "Users can delete their own training data"
  ON training_data
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = training_data.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_training_data_updated_at
  BEFORE UPDATE ON training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default training examples
INSERT INTO training_data (project_id, data_type, example_question, ideal_response, context) VALUES
  -- Product queries
  ((SELECT id FROM projects LIMIT 1), 'product', 
   'How much does [product_name] cost?',
   'The [product_name] costs $[price]. Currently, we have [stock] units in stock.',
   '{"variables": ["product_name", "price", "stock"]}'
  ),
  ((SELECT id FROM projects LIMIT 1), 'product',
   'Is [product_name] in stock?',
   'Yes, [product_name] is available. We currently have [stock] units in stock.',
   '{"variables": ["product_name", "stock"]}'
  ),
  
  -- Order queries
  ((SELECT id FROM projects LIMIT 1), 'order',
   'What''s the status of my order #[order_id]?',
   'Your order #[order_id] is currently [status]. [delivery_info]',
   '{"variables": ["order_id", "status", "delivery_info"]}'
  ),
  ((SELECT id FROM projects LIMIT 1), 'order',
   'When will my order #[order_id] arrive?',
   'Your order #[order_id] is [status]. [delivery_estimate]',
   '{"variables": ["order_id", "status", "delivery_estimate"]}'
  ),
  
  -- Refund queries
  ((SELECT id FROM projects LIMIT 1), 'refund',
   'What''s the status of my refund for order #[order_id]?',
   'The refund for order #[order_id] is [status]. [additional_info]',
   '{"variables": ["order_id", "status", "additional_info"]}'
  ),
  ((SELECT id FROM projects LIMIT 1), 'refund',
   'How long will my refund take for order #[order_id]?',
   'Your refund for order #[order_id] is [status]. [processing_time]',
   '{"variables": ["order_id", "status", "processing_time"]}'
  );