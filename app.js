require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 3000;
const dbConnect = process.env.MONGODB_CONNECT;
// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: dbConnect,
    collectionName: 'sessions',
    dbName: 'projectBoard',
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 3 }, // 세션 만료 시간 3시간
}));

// 로그인한 사용자 정보를 모든 템플릿에서 사용 가능하게 설정
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = {
      name: req.session.name,
      username: req.session.username,
      role: req.session.role
    };
  } else {
    res.locals.user = null;
  }
  next();
});

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

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

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/board', boardRouter);
app.use('/comment', commentRouter);
app.use('/attachment', attachmentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 