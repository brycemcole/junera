CREATE OR REPLACE FUNCTION extract_salary(description text)
RETURNS text AS $$
DECLARE
  normalized text;
  pattern text;
  patterns text[] := ARRAY[
    '\$\s*(\d+(?:\.\d+)?)\s*[-–—]\s*\$\s*(\d+(?:\.\d+)?)',
    '\$\s*(\d+\.?\d*)\s*(per\s*hour|hourly|per\s*hr|hr|h|\/ hour|\/hour|\/hr)\b',
    '(\d+\.?\d*)\s*[-–—]\s*(\d+\.?\d*)\s*\/\s*(hour|hr|h)',
    '\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*[-–—]\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?',
    '\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(to|through|up\s*to)\s*\$\s*(\d{1,3}(?:,\d{3})+|\d{3,})\s*(USD|CAD)?(?:\s*per\s*year)?',
    '\$\s*(\d+\.?\d*)k\s*[-–—]\s*\$\s*(\d+\.?\d*)k',
    '\$\s*(\d{3,}\.?\d*)\s*\b(monthly|month|months|mo)\b',
    '\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b'
  ];
  result text;
BEGIN
  IF description IS NULL THEN
    RETURN '';
  END IF;

  -- Normalize the text by removing HTML tags and replacing common HTML entities
  normalized := regexp_replace(description, '<[^>]*>', ' ', 'g');
  normalized := replace(normalized, '&nbsp;', ' ');
  normalized := replace(normalized, '&#160;', ' ');
  normalized := replace(normalized, '&mdash;', '—');
  normalized := replace(normalized, '&lt;', '<');
  normalized := replace(normalized, '&gt;', '>');
  normalized := btrim(normalized);

  FOREACH pattern IN ARRAY patterns
  LOOP
    result := substring(normalized from pattern);
    IF result IS NOT NULL THEN
      RETURN btrim(result);
    END IF;
  END LOOP;

  RETURN '';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
