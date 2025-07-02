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
  state: { type: String, default: 'temp' },
  role: { type: String, default: 'general' },
  createAt: { type: Date, default: Date.now },
  updateAt: { type: Date },
  deleteAt: { type: Date },
});
const User = mongoose.model('User', userSchema, 'users'); // model 구성 : 모델명, 스키마, 컬렉션명

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
      // 이미 존재하는 계정의 createAt을 현재시간으로 업데이트
      existing.createAt = new Date();
      await existing.save();
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
      state: 'temp',
      role: 'general',
      createAt: new Date(),
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
    // 세션 정리
    delete req.session.signupUserId;
    delete req.session.signup2faCode;
    delete req.session.signup2faEmail;
    if (user.state === 'temp') {
      // 승인 대기 계정: 가입 완료 안내 화면으로 이동
      return res.render('signupFinish');
    } else if (user.state === 'use') {
      // 승인된 계정: 자동 로그인
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.name = user.name;
      return res.redirect('/home');
    } else {
      // 기타 상태: 가입 완료 안내 화면으로 이동
      return res.render('signupFinish');
    }
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
    if (user.state === 'temp') {
      // 승인 대기 계정: introTemp.html로 이동
      return res.render('introTemp', { message: '본 계정은 관리자의 사용 승인이 나지 않았습니다. 관리자에게 문의 바랍니다.' });
    }
    // 로그인 성공: 세션에 사용자 정보 저장
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.name = user.name;
    if (user.tempPassword) {
      return res.redirect('/changePw');
    }
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
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.render('findId', { message: '이름과 이메일을 모두 입력하세요.' });
    }
    const user = await User.findOne({ name, email });
    if (!user) {
      return res.render('findId', { message: '입력한 정보가 없습니다.' });
    }
    // 이메일로 아이디 전송
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[ProjectBoard] 아이디 찾기 결과',
      text: `회원님의 아이디는 [${user.username}] 입니다.`,
    });
    return res.render('findId', { message: `${email} 로 아이디 정보를 보냈습니다.`, emailSent: true });
  } catch (err) {
    console.error('아이디 찾기 오류:', err);
    res.status(500).send('아이디 찾기 중 오류가 발생했습니다.');
  }
};

exports.findPw = async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.render('findPw', { message: '아이디와 이메일을 모두 입력하세요.' });
    }
    const user = await User.findOne({ username, email });
    if (!user) {
      return res.render('findPw', { message: '입력한 정보가 없습니다.' });
    }
    // 임시 비밀번호 생성
    const tempPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(tempPassword, 10);
    user.password = hash;
    user.tempPassword = tempPassword;
    await user.save();
    // 이메일로 임시 비밀번호 전송
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[ProjectBoard] 임시 비밀번호 안내',
      text: `임시 비밀번호: ${tempPassword}\n로그인 후 반드시 비밀번호를 변경해 주세요.`,
    });
    return res.render('findPw', { message: `${email} 로 임시 비밀번호를 보냈습니다.`, emailSent: true });
  } catch (err) {
    console.error('비밀번호 찾기 오류:', err);
    res.status(500).send('비밀번호 찾기 중 오류가 발생했습니다.');
  }
};

exports.changePw = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/');
    }
    const { newPassword, newPassword2 } = req.body;
    if (!newPassword || !newPassword2) {
      return res.render('changePw', { title: '비밀번호 변경', message: '모든 필드를 입력하세요.' });
    }
    if (newPassword !== newPassword2) {
      return res.render('changePw', { title: '비밀번호 변경', message: '비밀번호가 일치하지 않습니다.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/');
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.tempPassword = undefined;
    await user.save();
    res.redirect('/home');
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.status(500).send('비밀번호 변경 중 오류가 발생했습니다.');
  }
}; 