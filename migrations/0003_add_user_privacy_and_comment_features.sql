-- Add privacy columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_private" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "allow_tagging" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "allow_mentions" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "show_activity_status" boolean DEFAULT true;

-- Add comment editing/pinning columns
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "is_pinned" boolean DEFAULT false;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "is_edited" boolean DEFAULT false;
ALTER TABLE "comments" ADD COLUMN IF NOT EXISTS "edited_at" timestamp;

-- Add story polls table
CREATE TABLE IF NOT EXISTS "story_polls" (
    "id" serial PRIMARY KEY NOT NULL,
    "story_id" integer NOT NULL,
    "question" text NOT NULL,
    "option1" text NOT NULL,
    "option2" text NOT NULL,
    "option1_votes" integer DEFAULT 0,
    "option2_votes" integer DEFAULT 0,
    "created_at" timestamp DEFAULT now()
);

-- Add story poll votes table
CREATE TABLE IF NOT EXISTS "story_poll_votes" (
    "id" serial PRIMARY KEY NOT NULL,
    "poll_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "option" integer NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- Add story questions table
CREATE TABLE IF NOT EXISTS "story_questions" (
    "id" serial PRIMARY KEY NOT NULL,
    "story_id" integer NOT NULL,
    "question" text NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- Add story question responses table
CREATE TABLE IF NOT EXISTS "story_question_responses" (
    "id" serial PRIMARY KEY NOT NULL,
    "question_id" integer NOT NULL,
    "user_id" integer NOT NULL,
    "response" text NOT NULL,
    "created_at" timestamp DEFAULT now()
);
