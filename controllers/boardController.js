const boardService = require('../services/boardService');

exports.list = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'desc';
  const boardType = req.query.boardType || 'free';
  const { boards, total, pageCount, startNo } = await boardService.getBoardList({ page, limit, sort, boardType });
  const posts = boards.map((b, i) => ({
    ...b.toObject(),
    no: sort === 'desc' ? startNo - i : startNo + i
  }));
  res.render('board', {
    title: '게시판 목록',
    posts,
    page,
    limit,
    sort,
    pageCount,
    boardType
  });
};

exports.read = async (req, res) => {
  const board = await boardService.getBoardById(req.query.id);
  if (!board) return res.status(404).send('게시글 없음');
  res.render('boardRead', { title: '게시글 읽기', board, session: req.session });
};

exports.writeForm = (req, res) => {
  res.render('boardWrite', { title: '게시글 작성' });
};

exports.create = async (req, res) => {
  try {
    const { title, content, boardType, pinned, tags } = req.body;
    const author = req.session.userId;
    const tagsArr = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const board = await boardService.createBoard({
      title,
      content,
      author,
      boardType: boardType || 'free',
      pinned: pinned === 'true',
      tags: tagsArr,
      isPrivate: false,
      attachments: []
    });
    res.redirect(`/board/read?id=${board._id}`);
  } catch (err) {
    res.status(400).send('게시글 작성 오류: ' + err.message);
  }
};

exports.editForm = async (req, res) => {
  const board = await boardService.getBoardById(req.query.id);
  if (!board) return res.status(404).send('게시글 없음');
  res.render('boardEdit', { title: '게시글 수정', board });
};

exports.update = async (req, res) => {
  try {
    const { title, content, boardType } = req.body;
    await boardService.updateBoard(req.query.id, { title, content, boardType, updatedAt: new Date() });
    res.redirect(`/board/read?id=${req.query.id}`);
  } catch (err) {
    res.status(400).send('게시글 수정 오류: ' + err.message);
  }
}; 