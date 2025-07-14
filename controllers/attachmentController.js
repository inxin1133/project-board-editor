const attachmentService = require('../services/attachmentService');
const path = require('path');
const Attachment = require('../schemas/attachmentSchema');

exports.delete = async (req, res) => {
  try {
    const user = { userId: req.session.userId, role: req.session.role };
    await attachmentService.deleteAttachment(req.body.id, user);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

exports.deleteAll = async (req, res) => {
  try {
    const user = { userId: req.session.userId, role: req.session.role };
    await attachmentService.deleteAllAttachments(req.body.boardId, user);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

exports.downloadAll = async (req, res) => {
  try {
    await attachmentService.streamZipDownload(req.query.boardId, res);
  } catch (err) {
    res.status(400).send('다운로드 오류: ' + err.message);
  }
};

exports.download = async (req, res) => {
  try {
    const file = await Attachment.findById(req.params.id);
    if (!file) return res.status(404).send('파일 없음');
    const filePath = path.join(__dirname, '../uploads', file.filename);
    // 한글 파일명 깨짐 방지: Content-Disposition 직접 설정 (RFC 5987)
    const encodedName = encodeURIComponent(file.originalname).replace(/\+/g, '%20');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
    res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).send('파일 다운로드 오류: ' + err.message);
  }
}; 