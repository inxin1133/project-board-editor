const Board = require('../schemas/boardSchema');

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

exports.getBoardList = async ({ page = 1, limit = 10, sort = 'desc', boardType }) => {
  const query = { status: 'active' };
  if (boardType) query.boardType = boardType;
  const total = await Board.countDocuments(query);
  const pageCount = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const sortOption = sort === 'asc' ? 1 : -1;
  // pinned 먼저, 그 다음 createdAt 정렬
  const boards = await Board.find(query)
    .sort({ pinned: -1, createdAt: sortOption })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username name');
  let startNo = sort === 'desc' ? total - skip : skip + 1;
  return { boards, total, pageCount, startNo };
};

exports.getBoardById = async (id) => {
  return await Board.findById(id).populate('author', 'username name');
};

exports.updateBoard = async (id, updateData) => {
  return await Board.findByIdAndUpdate(id, updateData, { new: true });
}; 