const Comment = require('../schemas/commentSchema');
const User = require('../schemas/userSchema');

exports.createComment = async ({ board, content, author, parent }) => {
  return await Comment.create({ board, content, author, parent: parent || null });
};

exports.deleteComment = async (id) => {
  // soft delete
  return await Comment.findByIdAndUpdate(id, { isDeleted: true, status: 'deleted' });
};

exports.getCommentById = async (id) => {
  return await Comment.findById(id);
};

exports.getCommentsTree = async (boardId) => {
  // 모든 댓글/대댓글 조회 (isDeleted=false)
  const comments = await Comment.find({ board: boardId, isDeleted: false })
    .sort({ createdAt: 1 })
    .populate('author', 'username name');
  // 트리 구조로 변환
  const map = {}, roots = [];
  comments.forEach(c => {
    map[c._id] = {
      _id: c._id,
      content: c.content,
      authorName: c.author.name || c.author.username,
      authorId: c.author._id.toString(),
      createdAt: c.createdAt,
      parent: c.parent ? c.parent.toString() : null,
      depth: 0
    };
  });
  Object.values(map).forEach(c => {
    if (c.parent && map[c.parent]) {
      c.depth = map[c.parent].depth + 1;
      if (!map[c.parent].children) map[c.parent].children = [];
      map[c.parent].children.push(c);
    } else {
      roots.push(c);
    }
  });
  // 트리 구조를 평탄화(깊이 우선)로 반환
  const flat = [];
  function dfs(node) {
    flat.push(node);
    if (node.children) node.children.forEach(dfs);
  }
  roots.forEach(dfs);
  return flat;
}; 