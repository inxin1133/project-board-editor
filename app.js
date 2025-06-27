require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// Nunjucks 설정
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});
app.set('view engine', 'html');

// 기본 라우트
app.get('/', (req, res) => {
  res.render('index');
});

// 인증/인트로 레이아웃 기반 라우트
app.get('/signup', (req, res) => {
  res.render('signup', { title: '회원가입' });
});
app.get('/signup2fa', (req, res) => {
  res.render('signup2fa', { title: '2차 인증' });
});
app.get('/signupFinish', (req, res) => {
  res.render('signupFinish', { title: '가입 완료' });
});
app.get('/findId', (req, res) => {
  res.render('findId', { title: '아이디 찾기' });
});
app.get('/findPw', (req, res) => {
  res.render('findPw', { title: '비밀번호 찾기' });
});

// 메인 레이아웃 기반 라우트
app.get('/home', (req, res) => {
  res.render('home', { title: '홈' });
});
app.get('/member', (req, res) => {
  res.render('member', { title: '회원 목록' });
});
app.get('/memberView', (req, res) => {
  res.render('memberView', { title: '회원정보 보기' });
});
app.get('/memberEdit', (req, res) => {
  res.render('memberEdit', { title: '회원정보 수정' });
});
app.get('/board', (req, res) => {
  res.render('board', { title: '게시판 목록' });
});
app.get('/boardRead', (req, res) => {
  res.render('boardRead', { title: '게시글 읽기' });
});
app.get('/boardWrite', (req, res) => {
  res.render('boardWrite', { title: '게시글 작성' });
});
app.get('/boardEdit', (req, res) => {
  res.render('boardEdit', { title: '게시글 수정' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 