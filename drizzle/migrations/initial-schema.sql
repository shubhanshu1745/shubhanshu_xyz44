-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  fullName VARCHAR(255) NULL,
  bio TEXT NULL,
  location VARCHAR(255) NULL,
  profileImage VARCHAR(255) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isPlayer BOOLEAN DEFAULT FALSE,
  isVerified BOOLEAN DEFAULT FALSE
);

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  content TEXT NULL,
  mediaUrl VARCHAR(255) NULL,
  mediaType VARCHAR(50) NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isReel BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  postId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (userId, postId)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  postId INT NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  followerId INT NOT NULL,
  followingId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (followerId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followingId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (followerId, followingId)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1Id INT NOT NULL,
  user2Id INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user1Id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user2Id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (user1Id, user2Id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isRead BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  mediaUrl VARCHAR(255) NOT NULL,
  mediaType VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  battingStyle VARCHAR(50) NULL,
  bowlingStyle VARCHAR(50) NULL,
  totalMatches INT DEFAULT 0,
  totalRuns INT DEFAULT 0,
  highestScore INT DEFAULT 0,
  battingAverage FLOAT DEFAULT 0,
  wickets INT DEFAULT 0,
  bowlingAverage FLOAT DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_player_stats (userId)
);

-- Create player_matches table
CREATE TABLE IF NOT EXISTS player_matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  matchDate DATE NOT NULL,
  opponent VARCHAR(100) NOT NULL,
  venue VARCHAR(100) NOT NULL,
  matchType VARCHAR(50) NOT NULL,
  result VARCHAR(50) NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create player_match_performance table
CREATE TABLE IF NOT EXISTS player_match_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  matchId INT NOT NULL,
  runsScored INT DEFAULT 0,
  ballsFaced INT DEFAULT 0,
  wicketsTaken INT DEFAULT 0,
  oversBowled FLOAT DEFAULT 0,
  runsConceded INT DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (matchId) REFERENCES player_matches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_performance (userId, matchId)
);

-- Create sessions table for MySQL session store
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
);