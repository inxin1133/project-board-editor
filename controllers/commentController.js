const commentService = require('../services/commentService');
const boardService = require('../services/boardService');

exports.write = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: '로그인 필요' });
    const { board, content, parent } = req.body;
    const comment = await commentService.createComment({ board, content, author: userId, parent });
    // 댓글수 갱신
    await boardService.updateBoard(board, { $inc: { commentsCount: 1 } });
    res.json({ success: true, comment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.body;
    const comment = await commentService.getCommentById(id);
    if (!comment) return res.status(404).json({ success: false, message: '댓글 없음' });
    if (!(userId && (userId == comment.author.toString() || req.session.role === 'admin'))) {
      return res.status(403).json({ success: false, message: '권한 없음' });
    }
    await commentService.deleteComment(id);
    // 댓글수 갱신
    await boardService.updateBoard(comment.board, { $inc: { commentsCount: -1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id, content } = req.body;
    const comment = await commentService.getCommentById(id);
    if (!comment) return res.status(404).json({ success: false, message: '댓글 없음' });
    if (!(userId && (userId == comment.author.toString() || req.session.role === 'admin'))) {
      return res.status(403).json({ success: false, message: '권한 없음' });
    }
    await commentService.updateComment(id, content);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}; 