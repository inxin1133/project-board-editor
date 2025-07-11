const Board = require('../schemas/boardSchema');
const mongoose = require('mongoose');

// 추천 기록용 별도 컬렉션
const boardLikeSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
const BoardLike = mongoose.models.BoardLike || mongoose.model('BoardLike', boardLikeSchema, 'board_likes');

exports.createBoard = async ({ title, content, author, boardType, pinned, tags, isPrivate, attachments }) => {
  const board = new Board({
    title,
    content,
    author,
    boardType,
    pinned,
    tags,
    isPrivate,
    attachments,
  });
  await board.save();
  return board;
};

exports.getBoardList = async ({ page = 1, limit = 10, sort = 'desc', boardType, keyword }) => {
  const query = { status: 'active' };
  if (boardType) query.boardType = boardType;
  if (keyword) {
    const regex = new RegExp(keyword, 'i');
    query.$or = [
      { title: regex },
      { tags: regex },
    ];
  }
  const total = await Board.countDocuments(query);
  const pageCount = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const sortOption = sort === 'asc' ? 1 : -1;
  // pinned 먼저, 그 다음 createdAt 정렬
  let boards = await Board.find(query)
    .sort({ pinned: -1, createdAt: sortOption })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username name');
  // 작성자(username, name) 검색은 populate 후 필터링
  if (keyword) {
    boards = boards.filter(b =>
      b.title.match(new RegExp(keyword, 'i')) ||
      (b.author && ((b.author.username && b.author.username.match(new RegExp(keyword, 'i'))) || (b.author.name && b.author.name.match(new RegExp(keyword, 'i'))))) ||
      (b.tags && b.tags.some(tag => tag.match(new RegExp(keyword, 'i'))))
    );
  }
  let startNo = sort === 'desc' ? total - skip : skip + 1;
  return { boards, total, pageCount, startNo };
};

exports.getBoardById = async (id) => {
  return await Board.findById(id).populate('author', 'username name');
};

exports.updateBoard = async (id, updateData) => {
  return await Board.findByIdAndUpdate(id, updateData, { new: true });
};

exports.getAllBoards = async ({ boardType }) => {
  const query = { status: 'active' };
  if (boardType) query.boardType = boardType;
  return await Board.find(query).select('tags');
};

exports.increaseViews = async (boardId) => {
  await Board.findByIdAndUpdate(boardId, { $inc: { views: 1 } });
};

exports.toggleLike = async (boardId, userId) => {
  const like = await BoardLike.findOne({ board: boardId, user: userId });
  let liked;
  if (like) {
    // 추천 취소
    await BoardLike.deleteOne({ _id: like._id });
    await Board.findByIdAndUpdate(boardId, { $inc: { likes: -1 } });
    liked = false;
  } else {
    // 추천
    await BoardLike.create({ board: boardId, user: userId });
    await Board.findByIdAndUpdate(boardId, { $inc: { likes: 1 } });
    liked = true;
  }
  const board = await Board.findById(boardId);
  return { liked, likes: board.likes };
};

exports.isLiked = async (boardId, userId) => {
  const like = await BoardLike.findOne({ board: boardId, user: userId });
  return !!like;
}; 