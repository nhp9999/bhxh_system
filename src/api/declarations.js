router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Declaration.destroy({
      where: { id }
    });
    res.status(200).json({ message: 'Xóa đợt kê khai thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra khi xóa đợt kê khai' });
  }
}); 