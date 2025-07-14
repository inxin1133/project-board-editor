const Attachment = require('../schemas/attachmentSchema');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// 단일 첨부파일 삭제
exports.deleteAttachment = async (id, user) => {
  const att = await Attachment.findById(id);
  if (!att) throw new Error('파일 없음');
  // 권한 체크(업로더 또는 board 작성자 또는 admin)
  if (user.role !== 'admin' && user.userId !== String(att.uploader)) {
    throw new Error('권한 없음');
  }
  try { fs.unlinkSync(path.join(__dirname, '../uploads', att.filename)); } catch(e) {}
  await att.deleteOne();
  return true;
};

// 게시글의 모든 첨부파일 삭제
exports.deleteAllAttachments = async (boardId, user) => {
  const files = await Attachment.find({ board: boardId });
  for (const att of files) {
    if (user.role !== 'admin' && user.userId !== String(att.uploader)) continue;
    try { fs.unlinkSync(path.join(__dirname, '../uploads', att.filename)); } catch(e) {}
    await att.deleteOne();
  }
  return true;
};

// 게시글 첨부파일 목록
exports.getAttachmentsByBoard = async (boardId) => {
  return Attachment.find({ board: boardId });
};

// 전체 첨부파일 zip 다운로드 스트림
exports.streamZipDownload = async (boardId, res) => {
  const files = await Attachment.find({ board: boardId });
  if (!files.length) throw new Error('첨부파일 없음');
  res.attachment('attachments.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);
  for (const file of files) {
    const filePath = path.join(__dirname, '../uploads', file.filename);
    archive.file(filePath, { name: file.originalname });
  }
  await archive.finalize();
}; 