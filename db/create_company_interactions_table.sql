-- Table to manage following and reviews for companies
CREATE TABLE company_interactions (
    id SERIAL PRIMARY KEY,                       -- Unique identifier for each interaction
    user_id INT REFERENCES users(id),           -- Foreign key referencing the users table
    company_id INT REFERENCES companies(id),    -- Foreign key referencing the companies table
    is_following BOOLEAN DEFAULT FALSE,         -- Flag indicating if the user is following the company
    rating INT CHECK (rating BETWEEN 1 AND 5),  -- Optional rating (1 to 5 stars)
    comment TEXT,                               -- Optional comment or review
    created_at TIMESTAMP DEFAULT NOW(),         -- Timestamp of the interaction
    updated_at TIMESTAMP DEFAULT NOW()          -- Timestamp of the last update
);
