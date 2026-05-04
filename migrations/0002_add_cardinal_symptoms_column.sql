-- Migration: Add cardinalSymptoms column to causes table

ALTER TABLE causes ADD COLUMN cardinal_symptoms JSONB;

-- Update existing records to have an empty array as default if they don't have cardinal symptoms
UPDATE causes SET cardinal_symptoms = '[]' WHERE cardinal_symptoms IS NULL;

-- Make the column NOT NULL with a default empty array
ALTER TABLE causes ALTER COLUMN cardinal_symptoms SET NOT NULL;
ALTER TABLE causes ALTER COLUMN cardinal_symptoms SET DEFAULT '[]';
