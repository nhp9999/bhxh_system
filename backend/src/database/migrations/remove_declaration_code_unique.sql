-- Xóa ràng buộc UNIQUE trên declaration_code
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'declarations_declaration_code_key'
    ) THEN
        ALTER TABLE declarations DROP CONSTRAINT declarations_declaration_code_key;
    END IF;
END $$;

-- Xóa index trên declaration_code
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_declarations_declaration_code'
    ) THEN
        DROP INDEX idx_declarations_declaration_code;
    END IF;
END $$;

-- Cập nhật comment để đánh dấu trường declaration_code sẽ bị xóa trong tương lai
COMMENT ON COLUMN declarations.declaration_code IS 'Deprecated - Sẽ bị xóa trong tương lai. Sử dụng bhxh_code-batch_id thay thế'; 