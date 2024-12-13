import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

function DeclarationList() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [declarationToDelete, setDeclarationToDelete] = useState(null);

  const handleDelete = (declarationId) => {
    setDeclarationToDelete(declarationId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/declarations/${declarationToDelete}`);
      // Refresh lại danh sách sau khi xóa
      fetchDeclarations();
      setShowDeleteModal(false);
      toast.success('Xóa đợt kê khai thành công');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa đợt kê khai');
    }
  };

  return (
    <>
      {/* Phần code hiện tại... */}

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa đợt kê khai này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
} 