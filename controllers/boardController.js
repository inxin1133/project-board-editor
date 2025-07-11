const boardService = require('../services/boardService');
const commentService = require('../services/commentService');

exports.list = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || 'desc';
  const boardType = req.query.boardType || 'free';
  const keyword = req.query.keyword || '';
  const { boards, total, pageCount, startNo } = await boardService.getBoardList({ page, limit, sort, boardType, keyword });
  const posts = boards.map((b, i) => ({
    ...b.toObject(),
    no: sort === 'desc' ? startNo - i : startNo + i
  }));
  // 인기 태그 5개 추출
  const allBoards = await boardService.getAllBoards({ boardType });
  const tagCount = {};
  allBoards.forEach(b => {
    if (b.tags && b.tags.length) {
      b.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });
  const popularTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
  res.render('board', {
    title: '게시판 목록',
    posts,
    page,
    limit,
    sort,
    pageCount,
    boardType,
    keyword,
    popularTags,
    currentPath: '/board'
  });
};

exports.read = async (req, res) => {
  const boardId = req.query.id;
  // 조회수 증가
  await boardService.increaseViews(boardId);
  const board = await boardService.getBoardById(boardId);
  if (!board) return res.status(404).send('게시글 없음');
  // 댓글 트리 조회
  const comments = await commentService.getCommentsTree(boardId);
  // 추천 여부(로그인 계정 기준)
  let liked = false;
  if (req.session.userId) {
    liked = await boardService.isLiked(boardId, req.session.userId);
  }
  res.render('boardRead', { title: '게시글 읽기', board, session: req.session, currentPath: '/board', liked, comments });
};

// 추천/추천취소 토글
exports.toggleLike = async (req, res) => {
  try {
    const boardId = req.body.id;
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ success: false, message: '로그인 필요' });
    const result = await boardService.toggleLike(boardId, userId);
    res.json({ success: true, liked: result.liked, likes: result.likes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.writeForm = (req, res) => {
  res.render('boardWrite', { title: '게시글 작성', currentPath: '/board' });
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
  res.render('boardEdit', { title: '게시글 수정', board, currentPath: '/board' });
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

exports.delete = async (req, res) => {
  try {
    const boardId = req.body.id;
    const userId = req.session.userId;
    const board = await boardService.getBoardById(boardId);
    if (!board) return res.status(404).json({ success: false, message: '게시글 없음' });
    if (!(userId && (userId == board.author._id.toString() || req.session.role === 'admin'))) {
      return res.status(403).json({ success: false, message: '권한 없음' });
    }
    await boardService.updateBoard(boardId, { status: 'deleted' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}; 