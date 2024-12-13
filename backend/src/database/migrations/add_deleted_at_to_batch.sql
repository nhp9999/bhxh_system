-- Thêm cột deleted_at
ALTER TABLE declaration_batch
ADD COLUMN deleted_at TIMESTAMP,
ADD COLUMN deleted_by INTEGER REFERENCES users(id);

-- Thêm index cho deleted_at để tối ưu query
CREATE INDEX idx_declaration_batch_deleted_at ON declaration_batch(deleted_at); 