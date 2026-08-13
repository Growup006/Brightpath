-- BrightPath schema (Postgres / Neon)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('student','parent','teacher','admin')) DEFAULT 'student',
  class INTEGER,                    -- 6/7/8, students only
  learning_style TEXT,              -- 'dyslexia' | 'standard'
  parent_id INTEGER,                -- students only, FK -> users.id (parent)
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (parent_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic_key TEXT,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES users(id),
  UNIQUE(student_id, subject, chapter, topic_key)
);

CREATE TABLE IF NOT EXISTS placement_quiz_results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  recommended_level TEXT,
  raw_score INTEGER,
  taken_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tutor_conversations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  subject TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (student_id) REFERENCES users(id)
);
