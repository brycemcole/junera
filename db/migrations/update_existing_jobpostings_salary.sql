-- ...existing code...
UPDATE jobPostings
SET salary = extract_salary(description)
WHERE salary IS NULL OR salary = '';
