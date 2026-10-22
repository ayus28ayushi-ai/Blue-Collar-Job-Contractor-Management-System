-- worker table
CREATE TABLE IF NOT EXISTS worker (
    worker_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    city VARCHAR(60) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    expected_daily_wage NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (expected_daily_wage >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- skill table
CREATE TABLE IF NOT EXISTS skill (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(60) NOT NULL UNIQUE
);
 
-- worker skill table
CREATE TABLE IF NOT EXISTS worker_skill (
    worker_id INT NOT NULL REFERENCES worker(worker_id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill(skill_id),
    years_experience INT NOT NULL DEFAULT 0 CHECK (years_experience >= 0),
    proficiency VARCHAR(15) NOT NULL DEFAULT 'beginner'
                CHECK (proficiency IN ('beginner','intermediate','expert')),
    PRIMARY KEY (worker_id, skill_id)
);

-- contractor table
CREATE TABLE contractor (
    contractor_id SERIAL PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    city VARCHAR(60)  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- job category table 
CREATE TABLE job_category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(60) NOT NULL UNIQUE
);

-- job table 
CREATE TABLE job (
    job_id SERIAL PRIMARY KEY,
    contractor_id INT NOT NULL REFERENCES contractor(contractor_id) ON DELETE RESTRICT,
    category_id INT NOT NULL REFERENCES job_category(category_id) ON DELETE RESTRICT,
    title VARCHAR(120) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    pay_amount NUMERIC(10,2) NOT NULL CHECK (pay_amount > 0),
    pay_type VARCHAR(10) NOT NULL CHECK (pay_type IN ('daily','hourly','fixed')),
    workers_needed INT NOT NULL DEFAULT 1 CHECK (workers_needed > 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'open'
           CHECK (status IN ('open','in_progress','completed','cancelled')),
    posted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- job skill table
CREATE TABLE job_skill (
    job_id INT NOT NULL REFERENCES job(job_id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill(skill_id),
    min_years_required INT NOT NULL DEFAULT 0 CHECK (min_years_required >= 0),
    PRIMARY KEY (job_id, skill_id)
);

-- application table
CREATE TABLE application (
    application_id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES job(job_id) ON DELETE RESTRICT,
    worker_id INT NOT NULL REFERENCES worker(worker_id) ON DELETE RESTRICT,
    applied_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    status VARCHAR(15) NOT NULL DEFAULT 'applied'
            CHECK (status IN ('applied','shortlisted','accepted','rejected','withdrawn','completed')),
    UNIQUE (job_id, worker_id)
);

--rating table
CREATE TABLE rating (
    rating_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL UNIQUE REFERENCES application(application_id),
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT,
    rated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
 
-- payment table
CREATE TABLE payment (
    payment_id SERIAL PRIMARY KEY,
    application_id INT NOT NULL REFERENCES application(application_id),
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    paid_on DATE NOT NULL DEFAULT CURRENT_DATE,
    method VARCHAR(15) NOT NULL CHECK (method IN ('cash','upi','bank_transfer')),
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid'))
);