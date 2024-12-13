-- Thêm các cột cho việc duyệt/từ chối đợt kê khai
ALTER TABLE declaration_batch
ADD COLUMN approved_by INTEGER REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejected_by INTEGER REFERENCES users(id),
ADD COLUMN rejected_at TIMESTAMP,
ADD COLUMN admin_notes TEXT; 