-- 대학 정보 테이블
CREATE TABLE IF NOT EXISTS universities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE
);

-- 사용자-대학 관계 테이블 (이미 users 테이블에 university 필드가 있지만, 명시적으로 관계를 표현)
CREATE TABLE IF NOT EXISTS user_universities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, university_id)
);

-- 물품-대학 관계 테이블
CREATE TABLE IF NOT EXISTS item_universities (
  id SERIAL PRIMARY KEY,
  item_id VARCHAR(255) NOT NULL,
  university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(item_id, university_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_universities_domain ON universities(domain);
CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities(slug);
CREATE INDEX IF NOT EXISTS idx_user_universities_user_id ON user_universities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_universities_university_id ON user_universities(university_id);
CREATE INDEX IF NOT EXISTS idx_item_universities_item_id ON item_universities(item_id);
CREATE INDEX IF NOT EXISTS idx_item_universities_university_id ON item_universities(university_id);

