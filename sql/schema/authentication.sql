-- Central authentication table
CREATE TABLE IF NOT EXISTS app_user (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    google_sub VARCHAR(255) UNIQUE,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('worker', 'contractor', 'admin')),

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE app_user
ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20)
DEFAULT 'password'
CHECK (auth_provider IN ('password', 'google'));

-- Connect worker profiles to user accounts
ALTER TABLE worker
ADD COLUMN IF NOT EXISTS user_id INT
REFERENCES app_user(user_id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
idx_worker_user_id ON worker(user_id);

-- Connect contractor profiles to user accounts
ALTER TABLE contractor
ADD COLUMN IF NOT EXISTS user_id INT
REFERENCES app_user(user_id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
idx_contractor_user_id ON contractor(user_id);