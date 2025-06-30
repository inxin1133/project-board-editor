const express = require('express');
const router = express.Router();

// 게시판 관련 라우트
router.get('/', (req, res) => {
  res.render('board', { title: '게시판 목록' });
});
router.get('/read', (req, res) => {
  res.render('boardRead', { title: '게시글 읽기' });
});
router.get('/write', (req, res) => {
  res.render('boardWrite', { title: '게시글 작성' });
});
router.get('/edit', (req, res) => {
  res.render('boardEdit', { title: '게시글 수정' });
});

module.exports = router; 