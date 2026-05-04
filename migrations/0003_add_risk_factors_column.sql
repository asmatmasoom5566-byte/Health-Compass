-- Migration: Add riskFactors column to causes table

ALTER TABLE causes ADD COLUMN risk_factors JSONB;

-- Update existing records to have an empty array as default if they don't have risk factors
UPDATE causes SET risk_factors = '[]' WHERE risk_factors IS NULL;

-- Make the column NOT NULL with a default empty array
ALTER TABLE causes ALTER COLUMN risk_factors SET NOT NULL;
ALTER TABLE causes ALTER COLUMN risk_factors SET DEFAULT '[]';
