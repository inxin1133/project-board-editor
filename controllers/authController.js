const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const dbConnect = process.env.MONGODB_CONNECT;

// MongoDB 연결
mongoose.connect( dbConnect, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'projectBoard',
});

// User 스키마
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  phone: String,
  is2faVerified: { type: Boolean, default: false },
  tempPassword: String,
});
const User = mongoose.model('User', userSchema, 'users');

// 이메일 전송기
const transporter = nodemailer.createTransport({
  service: 'gmail', // 실제 서비스에 맞게 변경 필요
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 회원가입
exports.signup = async (req, res) => {
  try {
    const { username, password, password2, email, name, phone } = req.body;
    if (!username || !password || !password2 || !email || !name || !phone) {
      return res.status(400).send('모든 필드를 입력하세요.');
    }
    if (password !== password2) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }
    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).send('이미 존재하는 아이디 또는 이메일입니다.');
    }
    // 2차 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 이메일 발송 먼저 시도
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[ProjectBoard] 회원가입 2차 인증코드',
      text: `인증코드: ${code}`,
    });
    // 이메일 발송 성공 시 DB 저장
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hash,
      email,
      name,
      phone,
      is2faVerified: false,
    });
    // 2차 인증 코드 세션 저장
    req.session.signupUserId = user._id;
    req.session.signup2faCode = code;
    req.session.signup2faEmail = email;
    res.redirect('/signup2fa');
  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).send('회원가입 중 오류가 발생했습니다. 관리자에게 문의하세요.');
  }
};

// 2차 인증
exports.verify2fa = async (req, res) => {
  try {
    const { code } = req.body;
    if (!req.session.signupUserId || !req.session.signup2faCode) {
      return res.status(400).send('세션이 만료되었습니다. 처음부터 다시 시도하세요.');
    }
    if (code !== req.session.signup2faCode) {
      // 인증 실패 시 안내 메시지
      return res.render('signup2fa', { title: '2차 인증', message: '인증코드가 올바르지 않습니다. 다시 입력해 주세요.' });
    }
    // 인증 성공: 사용자 2fa 완료 처리
    const user = await User.findByIdAndUpdate(req.session.signupUserId, { is2faVerified: true }, { new: true });
    // 세션 정리 및 자동 로그인
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.name = user.name;
    delete req.session.signupUserId;
    delete req.session.signup2faCode;
    delete req.session.signup2faEmail;
    res.redirect('/home');
  } catch (err) {
    console.error(err);
    res.status(500).send('2차 인증 처리 중 오류가 발생했습니다.');
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('존재하지 않는 아이디입니다.');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).send('비밀번호가 일치하지 않습니다.');
    }
    if (!user.is2faVerified) {
      // 2차 인증 미완료: 인증코드 재생성 및 이메일 발송
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      req.session.signupUserId = user._id;
      req.session.signup2faCode = code;
      req.session.signup2faEmail = user.email;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '[ProjectBoard] 2차 인증코드 재발송',
        text: `인증코드: ${code}`,
      });
      // 인증번호 입력화면으로 이동, 알림 메시지 전달
      return res.render('signup2fa', { title: '2차 인증', message: '2차 인증이 필요합니다. 이메일로 인증코드를 확인하세요.' });
    }
    // 로그인 성공: 세션에 사용자 정보 저장
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.name = user.name;
    res.redirect('/home');
  } catch (err) {
    console.error('로그인 오류:', err);
    res.status(500).send('로그인 중 오류가 발생했습니다.');
  }
};

// 2차 인증번호 재발송
exports.resend2fa = async (req, res) => {
  try {
    const userId = req.session.signupUserId;
    if (!userId) {
      return res.status(400).send('세션이 만료되었습니다. 처음부터 다시 시도하세요.');
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).send('사용자를 찾을 수 없습니다.');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.signup2faCode = code;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: '[ProjectBoard] 2차 인증코드 재발송',
      text: `인증코드: ${code}`,
    });
    res.render('signup2fa', { title: '2차 인증', message: '인증코드가 이메일로 재발송되었습니다.' });
  } catch (err) {
    console.error('2차 인증 재발송 오류:', err);
    res.status(500).send('2차 인증코드 재발송 중 오류가 발생했습니다.');
  }
};

exports.findId = async (req, res) => {
  // 아이디 찾기 처리
};

exports.findPw = async (req, res) => {
  // 비밀번호 찾기 처리
}; 