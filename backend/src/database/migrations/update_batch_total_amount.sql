-- Cập nhật tổng số tiền cho tất cả các đợt kê khai
UPDATE declaration_batch db
SET total_amount = (
    SELECT COALESCE(SUM(d.actual_amount), 0)
    FROM declarations d
    WHERE d.batch_id = db.id 
    AND d.deleted_at IS NULL
); 