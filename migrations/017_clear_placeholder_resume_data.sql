-- Uploads used to store sample values instead of real extracted data, so
-- every resume showed the same keywords. Clear them.
UPDATE resumes
  SET parsed_text = NULL, extracted_keywords = '[]'::jsonb
  WHERE parsed_text = 'Parsed text placeholder';
