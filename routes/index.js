const express = require('express');
const router = express.Router();

// 기본 라우트
router.get('/', (req, res) => {
  res.render('index');
});

// 인증/인트로 레이아웃 기반 라우트
router.get('/signup', (req, res) => {
  res.render('signup', { title: '회원가입' });
});
router.post('/signup', require('../controllers/authController').signup);

router.get('/signup2fa', (req, res) => {
  res.render('signup2fa', { title: '2차 인증', message: req.query.message || null });
});
router.post('/signup2fa', require('../controllers/authController').verify2fa);

router.post('/login', require('../controllers/authController').login);

router.get('/signupFinish', (req, res) => {
  res.render('signupFinish', { title: '가입 완료' });
});

router.get('/findId', (req, res) => {
  res.render('findId', { title: '아이디 찾기' });
});
router.post('/findId', require('../controllers/authController').findId);

router.get('/findPw', (req, res) => {
  res.render('findPw', { title: '비밀번호 찾기' });
});
router.post('/findPw', require('../controllers/authController').findPw);

// 메인 홈
router.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('home', { title: '홈', name: req.session.name });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.post('/resend2fa', require('../controllers/authController').resend2fa);

module.exports = router; 