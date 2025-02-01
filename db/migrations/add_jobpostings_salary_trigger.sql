-- Create trigger function to set salary from description
CREATE OR REPLACE FUNCTION set_jobpostings_salary()
RETURNS trigger AS $$
BEGIN
  NEW.salary := extract_salary(NEW.description);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop any existing trigger and create a new one for INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_set_salary ON jobPostings;
CREATE TRIGGER trg_set_salary
BEFORE INSERT OR UPDATE ON jobPostings
FOR EACH ROW
EXECUTE FUNCTION set_jobpostings_salary();
