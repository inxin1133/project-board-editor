const express = require('express');
const router = express.Router();


// 기본 라우트
router.get('/', (req, res) => {
  res.render('index', { session: req.session });
});

// 인증/인트로 레이아웃 기반 라우트
router.get('/signup', (req, res) => {
  res.render('signup', { title: '회원가입', session: req.session });
});
router.post('/signup', require('../controllers/authController').signup); // 회원가입 컨트롤러 연결

router.get('/signup2fa', (req, res) => {
  res.render('signup2fa', { title: '2차 인증', message: req.query.message || null, session: req.session });
});
router.post('/signup2fa', require('../controllers/authController').verify2fa);

router.post('/login', require('../controllers/authController').login);

router.get('/signupFinish', (req, res) => {
  res.render('signupFinish', { title: '가입 완료', session: req.session });
});

router.get('/findId', (req, res) => {
  res.render('findId', { title: '아이디 찾기', session: req.session });
});
router.post('/findId', require('../controllers/authController').findId);

router.get('/findPw', (req, res) => {
  res.render('findPw', { title: '비밀번호 찾기', session: req.session });
});
router.post('/findPw', require('../controllers/authController').findPw);

// 메인 홈
router.get('/home', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('home', { title: '홈', name: req.session.name, currentPath: '/home' });
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

router.post('/resend2fa', require('../controllers/authController').resend2fa);

router.get('/changePw', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/');
  }
  res.render('changePw', { title: '비밀번호 변경', session: req.session });
});
router.post('/changePw', require('../controllers/authController').changePw);

module.exports = router; 