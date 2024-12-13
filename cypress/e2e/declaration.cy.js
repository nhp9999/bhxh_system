describe('Declaration Flow', () => {
  beforeEach(() => {
    // Login trước khi test
    cy.login('staff@example.com', 'password123');
  });

  it('should create new declaration successfully', () => {
    // Truy cập trang danh sách kê khai
    cy.visit('/declarations');
    
    // Click nút thêm mới
    cy.get('button').contains('Thêm mới').click();
    
    // Điền form
    cy.get('select[name="object_type"]').select('HGD');
    cy.get('input[name="bhxh_code"]').type('1234567890');
    cy.get('input[name="full_name"]').type('Nguyễn Văn A');
    cy.get('input[name="birth_date"]').type('1990-01-01');
    cy.get('select[name="gender"]').select('Nam');
    cy.get('input[name="cccd"]').type('123456789012');
    cy.get('input[name="phone_number"]').type('0123456789');
    cy.get('input[name="receipt_date"]').type('2024-01-01');
    cy.get('input[name="receipt_number"]').type('1234567');
    cy.get('input[name="new_card_effective_date"]').type('2024-01-01');
    cy.get('select[name="months"]').select('12');
    cy.get('select[name="plan"]').select('TM');
    cy.get('input[name="commune"]').type('Xã A');
    cy.get('input[name="hamlet"]').type('Ấp 1');
    cy.get('select[name="participant_number"]').select('1');
    cy.get('input[name="hospital_code"]').type('BV001');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Kiểm tra thông báo thành công
    cy.contains('Tạo kê khai thành công').should('be.visible');
    
    // Kiểm tra dữ liệu mới trong danh sách
    cy.get('table').contains('Nguyễn Văn A').should('be.visible');
  });

  it('should show validation errors for invalid data', () => {
    cy.visit('/declarations');
    cy.get('button').contains('Thêm mới').click();
    
    // Submit form trống
    cy.get('button[type="submit"]').click();
    
    // Kiểm tra các thông báo lỗi
    cy.contains('Vui lòng chọn đối tượng').should('be.visible');
    cy.contains('Vui lòng nhập mã BHXH').should('be.visible');
    cy.contains('Vui lòng nhập họ tên').should('be.visible');
  });
}); 