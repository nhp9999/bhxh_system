-- Xóa khóa ngoại hiện tại
ALTER TABLE declaration_batch
DROP CONSTRAINT IF EXISTS declaration_batch_created_by_fkey;

-- Thêm lại khóa ngoại với CASCADE DELETE
ALTER TABLE declaration_batch
ADD CONSTRAINT declaration_batch_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE CASCADE;

-- Xóa khóa ngoại updated_by
ALTER TABLE declaration_batch
DROP CONSTRAINT IF EXISTS declaration_batch_updated_by_fkey;

-- Thêm lại khóa ngoại updated_by với CASCADE DELETE
ALTER TABLE declaration_batch
ADD CONSTRAINT declaration_batch_updated_by_fkey
FOREIGN KEY (updated_by) REFERENCES users(id)
ON DELETE CASCADE;

-- Xóa khóa ngoại approved_by
ALTER TABLE declaration_batch
DROP CONSTRAINT IF EXISTS declaration_batch_approved_by_fkey;

-- Thêm lại khóa ngoại approved_by với CASCADE DELETE 
ALTER TABLE declaration_batch
ADD CONSTRAINT declaration_batch_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES users(id)
ON DELETE CASCADE;

-- Xóa khóa ngoại rejected_by
ALTER TABLE declaration_batch
DROP CONSTRAINT IF EXISTS declaration_batch_rejected_by_fkey;

-- Thêm lại khóa ngo���i rejected_by với CASCADE DELETE
ALTER TABLE declaration_batch
ADD CONSTRAINT declaration_batch_rejected_by_fkey
FOREIGN KEY (rejected_by) REFERENCES users(id)
ON DELETE CASCADE; 