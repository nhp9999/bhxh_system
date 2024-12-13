describe('Admin Approval Flow', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'admin123');
  });

  it('should approve declaration successfully', () => {
    cy.visit('/admin/declarations');
    
    // Tìm kê khai cần duyệt
    cy.get('table').contains('Nguyễn Văn A')
      .parent('tr')
      .within(() => {
        cy.contains('Duyệt').click();
      });
    
    // Kiểm tra thông báo thành công
    cy.contains('Đã duyệt kê khai thành công').should('be.visible');
    
    // Kiểm tra trạng thái đã được cập nhật
    cy.get('table').contains('Nguyễn Văn A')
      .parent('tr')
      .should('contain', 'Đã duyệt');
  });

  it('should reject declaration with reason', () => {
    cy.visit('/admin/declarations');
    
    // Tìm và từ chối kê khai
    cy.get('table').contains('Nguyễn Văn A')
      .parent('tr')
      .within(() => {
        cy.contains('Từ chối').click();
      });
    
    // Nhập lý do từ chối
    cy.get('textarea[name="rejection_reason"]')
      .type('Thông tin không chính xác');
    
    // Xác nhận từ chối
    cy.contains('Xác nhận từ chối').click();
    
    // Kiểm tra thông báo và trạng thái
    cy.contains('Đã từ chối kê khai').should('be.visible');
    cy.get('table').contains('Nguyễn Văn A')
      .parent('tr')
      .should('contain', 'Từ chối');
  });
}); 