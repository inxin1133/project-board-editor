require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

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
  cookie: { maxAge: 1000 * 60 * 60 }, // 1시간
}));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// Nunjucks 설정
nunjucks.configure('views', {
  autoescape: true,
  express: app,
  watch: true
});
app.set('view engine', 'html');

// 라우터 분리
const indexRouter = require('./routes/index');
const memberRouter = require('./routes/member');
const boardRouter = require('./routes/board');

app.use('/', indexRouter);
app.use('/member', memberRouter);
app.use('/board', boardRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 