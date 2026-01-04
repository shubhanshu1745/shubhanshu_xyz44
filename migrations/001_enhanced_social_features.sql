-- Enhanced Social Features Migration
-- This migration adds all the new tables needed for Instagram-like social features

-- User relationships tracking all social connections
CREATE TABLE IF NOT EXISTS user_relationships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('following', 'blocked', 'restricted', 'muted', 'close_friend')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_user_id)
);

-- Follow requests for private accounts
CREATE TABLE IF NOT EXISTS follow_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  UNIQUE(requester_id, requested_id)
);

-- Enhanced privacy settings
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_tagging BOOLEAN DEFAULT true,
  allow_mentions BOOLEAN DEFAULT true,
  show_activity_status BOOLEAN DEFAULT true,
  allow_message_requests BOOLEAN DEFAULT true,
  allow_story_replies BOOLEAN DEFAULT true,
  who_can_see_followers TEXT DEFAULT 'everyone' CHECK (who_can_see_followers IN ('everyone', 'followers', 'no_one')),
  who_can_see_following TEXT DEFAULT 'everyone' CHECK (who_can_see_following IN ('everyone', 'followers', 'no_one')),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Close friends management
CREATE TABLE IF NOT EXISTS close_friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Post collaborators
CREATE TABLE IF NOT EXISTS post_collaborators (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Post mentions
CREATE TABLE IF NOT EXISTS post_mentions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  mentioned_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentioned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mention_type TEXT DEFAULT 'post' CHECK (mention_type IN ('post', 'comment')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced story privacy
CREATE TABLE IF NOT EXISTS story_privacy (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  visibility_type TEXT DEFAULT 'followers' CHECK (visibility_type IN ('public', 'followers', 'close_friends', 'custom')),
  custom_list JSONB, -- Array of user IDs for custom visibility
  hidden_from JSONB, -- Array of user IDs to hide from
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content reports
CREATE TABLE IF NOT EXISTS content_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'comment', 'user')),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group chats
CREATE TABLE IF NOT EXISTS group_chats (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Group members
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(group_id, user_id)
);

-- Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message requests
CREATE TABLE IF NOT EXISTS message_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- User restrictions (blocked, muted, restricted users)
CREATE TABLE IF NOT EXISTS user_restrictions (
  id SERIAL PRIMARY KEY,
  restricter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restricted_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('blocked', 'muted', 'restricted')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(restricter_id, restricted_id, restriction_type)
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_user_relationships_user_id ON user_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_target_user_id ON user_relationships(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_type ON user_relationships(relationship_type);

CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_id ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requested_id ON follow_requests(requested_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);

CREATE INDEX IF NOT EXISTS idx_close_friends_user_id ON close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_friend_id ON close_friends(friend_id);

CREATE INDEX IF NOT EXISTS idx_post_collaborators_post_id ON post_collaborators(post_id);
CREATE INDEX IF NOT EXISTS idx_post_collaborators_user_id ON post_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_post_mentions_post_id ON post_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_mentions_mentioned_user_id ON post_mentions(mentioned_user_id);

CREATE INDEX IF NOT EXISTS idx_story_privacy_story_id ON story_privacy(story_id);
CREATE INDEX IF NOT EXISTS idx_story_privacy_visibility_type ON story_privacy(visibility_type);

CREATE INDEX IF NOT EXISTS idx_content_reports_reporter_id ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON group_members(is_active);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_message_requests_sender_id ON message_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_recipient_id ON message_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_requests_status ON message_requests(status);

CREATE INDEX IF NOT EXISTS idx_user_restrictions_restricter_id ON user_restrictions(restricter_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_restricted_id ON user_restrictions(restricted_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_type ON user_restrictions(restriction_type);

-- Create default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings);