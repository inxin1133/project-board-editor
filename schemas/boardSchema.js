const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  url: String,
  size: Number,
}, { _id: false });

const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  boardType: { type: String, default: 'general' },
  tags: [String],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'deleted', 'hidden'], default: 'active' },
  pinned: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
});

const Board = mongoose.model('Board', boardSchema, 'boards');

module.exports = Board; 