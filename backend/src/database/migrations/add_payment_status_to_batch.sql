-- 1. Tạm thời vô hiệu hóa các trigger (nếu có)
ALTER TABLE declaration_batch DISABLE TRIGGER ALL;

-- 2. Xóa các constraint cũ
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Xóa tất cả các constraint check trên bảng declaration_batch
    FOR r IN (SELECT conname FROM pg_constraint 
              WHERE conrelid = 'declaration_batch'::regclass 
              AND contype = 'c'
              AND (conname LIKE '%status%' OR conname LIKE '%payment_status%'))
    LOOP
        EXECUTE 'ALTER TABLE declaration_batch DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. Thêm constraint mới cho status
ALTER TABLE declaration_batch
ADD CONSTRAINT check_status
CHECK (status::text IN ('pending', 'submitted', 'approved', 'processing', 'completed', 'rejected'));

-- 4. Thêm constraint mới cho payment_status
ALTER TABLE declaration_batch
ADD CONSTRAINT check_payment_status
CHECK (payment_status::text IN ('unpaid', 'paid'));

-- 5. Cập nhật các giá trị không hợp lệ
UPDATE declaration_batch
SET payment_status = 'unpaid'
WHERE payment_status IS NULL 
   OR payment_status NOT IN ('unpaid', 'paid');

UPDATE declaration_batch
SET status = 'pending'
WHERE status IS NULL 
   OR status NOT IN ('pending', 'submitted', 'approved', 'processing', 'completed', 'rejected');

-- 6. Kích hoạt lại các trigger
ALTER TABLE declaration_batch ENABLE TRIGGER ALL; 