-- 물품 테이블
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  seller_id UUID NOT NULL,
  seller_name VARCHAR(255) NOT NULL,
  seller_department VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

