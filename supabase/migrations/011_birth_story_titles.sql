-- Allow customers to edit the headline above each birth-story narrative
-- (previously hardcoded to "The moment I heard you cry..." and
-- "I was completely unprepared for how I felt...").
ALTER TABLE birth_stories
  ADD COLUMN IF NOT EXISTS mom_title TEXT,
  ADD COLUMN IF NOT EXISTS dad_title TEXT;
