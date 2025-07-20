require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { DateTime } = require('luxon');
const User = require('./schemas/userSchema');

const app = express();
const PORT = process.env.PORT || 3000;
const dbConnect = process.env.MONGODB_CONNECT;
// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정 (MongoDB 인증 문제로 인해 메모리 기반으로 임시 변경)
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 3 }, // 세션 만료 시간 3시간
}));

// 로그인한 사용자 정보를 모든 템플릿에서 사용 가능하게 설정 (임시로 비활성화)
app.use(async (req, res, next) => {
  // 임시로 모든 사용자에게 접근 권한 부여
  res.locals.me = {
    name: '테스트 사용자',
    username: 'test',
    role: 'user',
    statusMessage: '테스트 중',
    profileImage: null,
  };
  next();
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Nunjucks 설정
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});
// 날짜 포맷 필터 등록
env.addFilter('date', function(date, format = 'yyyy-MM-dd HH:mm') {
  if (!date) return '';
  try {
    return DateTime.fromJSDate(date).toFormat(format);
  } catch (e) {
    return '';
  }
});
app.set('view engine', 'html');

// 라우터 분리
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const boardRouter = require('./routes/board');
const commentRouter = require('./routes/comment');
const attachmentRouter = require('./routes/attachment');
const editorRouter = require('./routes/editor');

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/board', boardRouter);
app.use('/comment', commentRouter);
app.use('/attachment', attachmentRouter);
app.use('/editor', editorRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 