CREATE TABLE IF NOT EXISTS user_relationships (
    follower_id INTEGER NOT NULL REFERENCES users(id),
    followed_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_relationships_pkey PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT user_relationships_self_follow_check CHECK (follower_id != followed_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_relationships_follower ON user_relationships(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_followed ON user_relationships(followed_id);
