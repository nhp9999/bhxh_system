-- Thêm các cột địa chỉ vào bảng users
ALTER TABLE users
ADD COLUMN province character varying(50),
ADD COLUMN district character varying(50),
ADD COLUMN commune character varying(50); 