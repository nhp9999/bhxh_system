-- Thêm cột total_amount vào bảng declaration_batch
ALTER TABLE declaration_batch
ADD COLUMN total_amount DECIMAL(12,2) DEFAULT 0; 