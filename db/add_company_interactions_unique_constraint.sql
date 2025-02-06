-- Add unique constraint to prevent duplicate interactions
ALTER TABLE company_interactions ADD CONSTRAINT unique_user_company_interaction UNIQUE (user_id, company_id);
