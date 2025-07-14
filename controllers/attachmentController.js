const attachmentService = require('../services/attachmentService');

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