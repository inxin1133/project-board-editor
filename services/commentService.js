const Comment = require('../schemas/commentSchema');
const User = require('../schemas/userSchema');

exports.createComment = async ({ board, content, author, parent }) => {
  return await Comment.create({ board, content, author, parent: parent || null });
};

exports.deleteComment = async (id) => {
  // 하위 답글이 있는지 확인
  const childCount = await Comment.countDocuments({ parent: id, isDeleted: false });
  if (childCount > 0) {
    // 하위 답글이 있으면 상태만 변경 (soft delete)
    await Comment.findByIdAndUpdate(id, {
      isDeleted: true,
      status: 'deleted',
    });
    return { deleted: false }; // 완전 삭제 아님
  } else {
    // 완전 삭제
    await Comment.deleteOne({ _id: id });
    return { deleted: true }; // 완전 삭제
  }
};

exports.updateComment = async (id, content) => {
  return await Comment.findByIdAndUpdate(id, { content, updatedAt: new Date() }, { new: true });
};

exports.getCommentById = async (id) => {
  return await Comment.findById(id);
};

exports.getCommentsTree = async (boardId) => {
  // 모든 댓글/대댓글 조회 (삭제된 댓글도 포함)
  const comments = await Comment.find({ board: boardId })
    .sort({ createdAt: 1 })
    .populate('author', 'username name');
  // 트리 구조로 변환
  const map = {}, roots = [];
  comments.forEach(c => {
    map[c._id] = {
      _id: c._id,
      content: c.content,
      status: c.status, // status 필드 추가
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