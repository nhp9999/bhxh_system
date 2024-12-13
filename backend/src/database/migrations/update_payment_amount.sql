-- Tạo function để tính và cập nhật payment_amount
CREATE OR REPLACE FUNCTION update_batch_payment_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật payment_amount bằng tổng actual_amount trừ đi tổng số tiền hỗ trợ
    UPDATE declaration_batch
    SET payment_amount = (
        SELECT COALESCE(SUM(d.actual_amount), 0) - (COALESCE(declaration_batch.support_amount, 0) * COUNT(d.id))
        FROM declarations d
        WHERE d.batch_id = declaration_batch.id
        AND d.deleted_at IS NULL
    )
    WHERE id = NEW.batch_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger để tự động cập nhật payment_amount khi có thay đổi trong bảng declarations
DROP TRIGGER IF EXISTS tr_update_batch_payment_amount ON declarations;
CREATE TRIGGER tr_update_batch_payment_amount
AFTER INSERT OR UPDATE OR DELETE ON declarations
FOR EACH ROW
EXECUTE FUNCTION update_batch_payment_amount();

-- Tạo trigger để cập nhật payment_amount khi support_amount thay đổi
CREATE OR REPLACE FUNCTION update_payment_amount_on_support_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Cập nhật payment_amount khi support_amount thay đổi
    UPDATE declaration_batch
    SET payment_amount = (
        SELECT COALESCE(SUM(d.actual_amount), 0) - (NEW.support_amount * COUNT(d.id))
        FROM declarations d
        WHERE d.batch_id = NEW.id
        AND d.deleted_at IS NULL
    )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_payment_amount_on_support_change ON declaration_batch;
CREATE TRIGGER tr_update_payment_amount_on_support_change
AFTER UPDATE OF support_amount ON declaration_batch
FOR EACH ROW
EXECUTE FUNCTION update_payment_amount_on_support_change();

-- Cập nhật payment_amount cho tất cả các batch hiện có
UPDATE declaration_batch
SET payment_amount = (
    SELECT COALESCE(SUM(d.actual_amount), 0) - (COALESCE(declaration_batch.support_amount, 0) * COUNT(d.id))
    FROM declarations d
    WHERE d.batch_id = declaration_batch.id
    AND d.deleted_at IS NULL
    GROUP BY declaration_batch.id
); 