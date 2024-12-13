-- Xóa khóa ngoại user_id hiện tại
ALTER TABLE declarations
DROP CONSTRAINT IF EXISTS declarations_user_id_fkey;

-- Thêm lại khóa ngoại user_id với CASCADE DELETE
ALTER TABLE declarations
ADD CONSTRAINT declarations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Xóa khóa ngoại created_by
ALTER TABLE declarations
DROP CONSTRAINT IF EXISTS declarations_created_by_fkey;

-- Thêm lại khóa ngoại created_by với CASCADE DELETE
ALTER TABLE declarations
ADD CONSTRAINT declarations_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE CASCADE;

-- Xóa khóa ngoại updated_by
ALTER TABLE declarations
DROP CONSTRAINT IF EXISTS declarations_updated_by_fkey;

-- Thêm lại khóa ngoại updated_by với CASCADE DELETE
ALTER TABLE declarations
ADD CONSTRAINT declarations_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES users(id)
ON DELETE CASCADE; 