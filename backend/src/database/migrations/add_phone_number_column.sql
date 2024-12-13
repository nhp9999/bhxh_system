-- Đổi tên cột phone thành phone_number nếu cột phone tồn tại
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE users RENAME COLUMN phone TO phone_number;
    ELSE
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
    END IF;
END $$; 