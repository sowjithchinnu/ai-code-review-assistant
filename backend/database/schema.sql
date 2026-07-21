CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(500),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath TEXT,
    content TEXT,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL,
    overall_score INT,
    summary TEXT,
    review_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE TABLE review_findings (
    id SERIAL PRIMARY KEY,
    review_id INT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    issue TEXT NOT NULL,
    explanation TEXT,
    suggestion TEXT,
    line_number INT,

    CONSTRAINT fk_review
        FOREIGN KEY (review_id)
        REFERENCES reviews(id)
        ON DELETE CASCADE
);

CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    language VARCHAR(50),
    code TEXT,
    file_name VARCHAR(255),
    ai_review_summary TEXT,
    cyclomatic_complexity NUMERIC(6,2),
    issues_found INT DEFAULT 0,
    documentation TEXT,
    ai_review_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);