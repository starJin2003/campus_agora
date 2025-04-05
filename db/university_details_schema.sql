-- 대학 상세 정보 테이블
CREATE TABLE IF NOT EXISTS university_details (
  id SERIAL PRIMARY KEY,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  description TEXT,
  location VARCHAR(255),
  founded_year INTEGER,
  website VARCHAR(255),
  student_count INTEGER,
  logo_url TEXT,
  official_name VARCHAR(255), -- 공식 명칭 필드 추가
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(university_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_university_details_university_id ON university_details(university_id);

