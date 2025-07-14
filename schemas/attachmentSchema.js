const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true }, // 저장 파일명
  originalname: { type: String, required: true }, // 원본 파일명
  url: { type: String, required: true }, // 접근 경로/URL
  size: { type: Number, required: true }, // 바이트 단위 크기
  mimetype: { type: String }, // 파일 타입(MIME)
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 업로더
  uploadedAt: { type: Date, default: Date.now }, // 업로드 일시
  // 범용 참조 필드
  refType: { type: String }, // 'user', 'board', 'comment', ...
  refId: { type: mongoose.Schema.Types.ObjectId }, // 해당 엔티티의 ObjectId
  // 직접 참조 필드(빠른 조회용)
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' }, // 연관 게시글
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // 연관 댓글
  meta: { type: mongoose.Schema.Types.Mixed }, // 기타 메타데이터(확장용)
});

const Attachment = mongoose.model('Attachment', attachmentSchema, 'attachments');

module.exports = Attachment; 