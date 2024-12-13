-- Thêm cột support_amount vào bảng declaration_batch
ALTER TABLE declaration_batch 
ADD COLUMN support_amount NUMERIC(15,2) DEFAULT 0;

-- Thêm comment cho cột
COMMENT ON COLUMN declaration_batch.support_amount IS 'Số tiền hỗ trợ cho mỗi người trong đợt kê khai';

-- Thêm ràng buộc kiểm tra số tiền không âm
ALTER TABLE declaration_batch
ADD CONSTRAINT chk_support_amount_non_negative 
CHECK (support_amount >= 0); 