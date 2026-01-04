-- Add comment editing and pinning fields
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;

-- Create story polls table
CREATE TABLE IF NOT EXISTS story_polls (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  option1 TEXT NOT NULL,
  option2 TEXT NOT NULL,
  option3 TEXT,
  option4 TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create story poll votes table
CREATE TABLE IF NOT EXISTS story_poll_votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  option_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create story questions table
CREATE TABLE IF NOT EXISTS story_questions (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create story question responses table
CREATE TABLE IF NOT EXISTS story_question_responses (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_story_polls_story_id ON story_polls(story_id);
CREATE INDEX IF NOT EXISTS idx_story_poll_votes_poll_id ON story_poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_story_poll_votes_user_id ON story_poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_questions_story_id ON story_questions(story_id);
CREATE INDEX IF NOT EXISTS idx_story_question_responses_question_id ON story_question_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_pinned ON comments(post_id, is_pinned) WHERE is_pinned = true;
