const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true }, // 게시글 참조
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // 부모 댓글(대댓글용)
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 작성자
  content: { type: String, required: true }, // 내용
  status: { type: String, enum: ['active', 'deleted', 'hidden'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
}, {
  timestamps: false
});

const Comment = mongoose.model('Comment', commentSchema, 'comments');

module.exports = Comment; 