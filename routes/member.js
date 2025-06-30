const express = require('express');
const router = express.Router();

// 회원 관련 라우트
router.get('/', (req, res) => {
  res.render('member', { title: '회원 목록' });
});
router.get('/view', (req, res) => {
  res.render('memberView', { title: '회원정보 보기' });
});
router.get('/edit', (req, res) => {
  res.render('memberEdit', { title: '회원정보 수정' });
});

module.exports = router; 