-- Add full-text search vector column to Email table
ALTER TABLE "Email" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Email_searchVector_idx" ON "Email" USING GIN ("searchVector");

-- Create function to update search vector
CREATE OR REPLACE FUNCTION email_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW."subject", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."fromName", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."fromAddress", '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW."textBody", '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW."snippet", '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector on INSERT/UPDATE
DROP TRIGGER IF EXISTS email_search_vector_trigger ON "Email";
CREATE TRIGGER email_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "subject", "fromName", "fromAddress", "textBody", "snippet"
  ON "Email"
  FOR EACH ROW
  EXECUTE FUNCTION email_search_vector_update();

-- Update existing emails with search vectors
UPDATE "Email" SET "searchVector" = 
  setweight(to_tsvector('english', COALESCE("subject", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("fromName", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE("fromAddress", '')), 'B') ||
  setweight(to_tsvector('english', COALESCE("textBody", '')), 'C') ||
  setweight(to_tsvector('english', COALESCE("snippet", '')), 'C');
