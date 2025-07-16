const bcrypt = require('bcrypt'); // 비밀번호 해싱
const mongoose = require('mongoose'); // MongoDB 연결
const nodemailer = require('nodemailer'); // 이메일 전송
const XLSX = require('xlsx'); // 엑셀 파일 처리
const path = require('path'); // 경로 처리
const fs = require('fs'); // 파일 시스템 처리

const authService = require('../services/authService'); // 인증 서비스
const User = require('../schemas/userSchema'); // 사용자 스키마 

const dbConnect = process.env.MONGODB_CONNECT; // MongoDB 연결 문자열

// MongoDB 연결
mongoose.connect( dbConnect, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'projectBoard',
});

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
    const { user, code } = await authService.signup({ username, password, email, name, phone });
    req.session.signupUserId = user._id;
    req.session.signup2faCode = code;
    req.session.signup2faEmail = email;
    res.redirect('/signup2fa');
  } catch (err) {
    res.status(400).send(err.message || '회원가입 중 오류가 발생했습니다.');
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
      return res.render('signup2fa', { title: '2차 인증', message: '인증코드가 올바르지 않습니다. 다시 입력해 주세요.' });
    }
    const user = await authService.verify2fa(req.session.signupUserId);
    delete req.session.signupUserId;
    delete req.session.signup2faCode;
    delete req.session.signup2faEmail;
    if (user.state === 'temp') {
      return res.render('signupFinish');
    } else if (user.state === 'use') {
      req.session.userId = user._id;
      req.session.username = user.username;
      req.session.name = user.name;
      return res.redirect('/home');
    } else {
      return res.render('signupFinish');
    }
  } catch (err) {
    res.status(500).send('2차 인증 처리 중 오류가 발생했습니다.');
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await authService.login({ username, password });
    if (!user.is2faVerified) {
      const code = await authService.send2faCode(user);
      req.session.signupUserId = user._id;
      req.session.signup2faCode = code;
      req.session.signup2faEmail = user.email;
      return res.render('signup2fa', { title: '2차 인증', message: '2차 인증이 필요합니다. 이메일로 인증코드를 확인하세요.' });
    }
    if (user.state === 'temp') {
      return res.render('introTemp', { message: '본 계정은 관리자의 사용 승인이 나지 않았습니다. 관리자에게 문의 바랍니다.' });
    }
    req.session.userId = user._id;
    req.session.username = user.username;
    req.session.name = user.name;
    req.session.role = user.role;
    if (user.tempPassword) {
      return res.redirect('/changePw');
    }
    res.redirect('/home');
  } catch (err) {
    // 로그인 실패 시 로그인 페이지에 에러 메시지와 함께 렌더링
    res.render('index', { title: '로그인', message: err.message, session: req.session });
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

// 회원 상태 변경
exports.updateUserState = async (req, res) => {
  try {
    const { username, state } = req.body;
    if (!username || !state) return res.json({ success: false, message: '필수 정보 누락' });
    const user = await User.findOneAndUpdate({ username }, { state, updateAt: new Date() }, { new: true });
    if (!user) return res.json({ success: false, message: '사용자 없음' });
    res.json({ success: true });
  } catch (err) {
    console.error('회원 상태 변경 오류:', err);
    res.json({ success: false, message: '서버 오류' });
  }
};

// 회원 권한 변경
exports.updateUserRole = async (req, res) => {
  try {
    const { username, role } = req.body;
    if (!username || !role) return res.json({ success: false, message: '필수 정보 누락' });
    const user = await User.findOneAndUpdate({ username }, { role, updateAt: new Date() }, { new: true });
    if (!user) return res.json({ success: false, message: '사용자 없음' });
    res.json({ success: true });
  } catch (err) {
    console.error('회원 권한 변경 오류:', err);
    res.json({ success: false, message: '서버 오류' });
  }
};

// 2차 인증 상태 변경
exports.update2faStatus = async (req, res) => {
  try {
    const { username, is2faVerified } = req.body;
    if (typeof is2faVerified === 'undefined' || !username) return res.json({ success: false, message: '필수 정보 누락' });
    const user = await User.findOneAndUpdate({ username }, { is2faVerified, updateAt: new Date() }, { new: true });
    if (!user) return res.json({ success: false, message: '사용자 없음' });
    res.json({ success: true });
  } catch (err) {
    console.error('2차 인증 상태 변경 오류:', err);
    res.json({ success: false, message: '서버 오류' });
  }
};

// 사용자 목록 (pagination)
exports.userList = async (req, res) => {
  try {
    const perPage = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort = req.query.sort === 'asc' ? 'asc' : 'desc';
    const total = await User.countDocuments();
    const sortOption = sort === 'asc' ? 1 : -1;
    const users = await User.find({}, 'username name email state role')
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createAt: sortOption });
    // No. 계산: 역순(내림차순)일 때는 큰 번호가 위, 오름차순일 때는 작은 번호가 위
    let startNo;
    if (sort === 'desc') {
      startNo = total - (page - 1) * perPage;
    } else {
      startNo = (page - 1) * perPage + 1;
    }
    res.render('user', {
      title: '회원 목록',
      users,
      total,
      page,
      perPage,
      pageCount: Math.ceil(total / perPage),
      sort,
      startNo,
      currentPath: '/user'
    });
  } catch (err) {
    console.error('회원 목록 조회 오류:', err);
    res.status(500).send('회원 목록 조회 중 오류가 발생했습니다.');
  }
};

// 사용자 상세
exports.userDetail = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.query.id });
    if (!user) {
      return res.status(404).send('사용자를 찾을 수 없습니다.');
    }
    res.render('userView', {
      title: '회원정보 보기',
      user,
      session: req.session,
    });
  } catch (err) {
    console.error('회원정보 조회 오류:', err);
    res.status(500).send('회원정보 조회 중 오류가 발생했습니다.');
  }
};

// 이름/전화번호 수정
exports.editInfo = async (req, res) => {
  try {
    const { username, name, phone } = req.body;
    if (!username || !name) return res.json({ success: false, message: '필수 정보 누락' });
    const user = await User.findOneAndUpdate({ username }, { name, phone, updateAt: new Date() }, { new: true });
    if (!user) return res.json({ success: false, message: '사용자 없음' });
    res.json({ success: true });
  } catch (err) {
    console.error('회원정보 수정 오류:', err);
    res.json({ success: false, message: '서버 오류' });
  }
};

// 비밀번호 변경 (admin: 바로 변경, general: 기존 비밀번호 확인)
exports.changePassword = async (req, res) => {
  try {
    const { username, newPassword, currentPassword } = req.body;
    if (!username || !newPassword) return res.json({ success: false, message: '필수 정보 누락' });
    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false, message: '사용자 없음' });
    // admin은 currentPassword 없이 변경, general은 currentPassword 확인 필요
    if (req.session.role === 'admin') {
      // 바로 변경
      user.password = await bcrypt.hash(newPassword, 10);
      user.tempPassword = undefined;
      user.updateAt = new Date();
      await user.save();
      return res.json({ success: true });
    } else {
      // 기존 비밀번호 확인
      if (!currentPassword) return res.json({ success: false, message: '기존 비밀번호를 입력하세요.' });
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.json({ success: false, message: '기존 비밀번호가 일치하지 않습니다.' });
      user.password = await bcrypt.hash(newPassword, 10);
      user.tempPassword = undefined;
      user.updateAt = new Date();
      await user.save();
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    res.json({ success: false, message: '서버 오류' });
  }
};

// 엑셀 양식 다운로드
exports.downloadExcelTemplate = (req, res) => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['username', 'name', 'email', 'phone', 'role', 'state'],
    ['user01', '홍길동', 'user01@email.com', '010-1234-5678', 'general', 'use'],
    ['user02', '김철수', 'user02@email.com', '010-2345-6789', 'admin', 'temp'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  const filePath = path.join(__dirname, '../uploads/users_template.xlsx');
  XLSX.writeFile(wb, filePath);
  res.download(filePath, 'users_template.xlsx', err => {
    if (err) console.error('엑셀 양식 다운로드 오류:', err);
    // 다운로드 후 임시 파일 삭제
    fs.unlink(filePath, () => {});
  });
};

// 엑셀 업로드 (회원 일괄 등록/수정)
exports.uploadExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('엑셀 파일을 업로드하세요.');
    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    let success = 0, fail = 0, errors = [];
    for (const row of rows) {
      if (!row.username || !row.name || !row.email) {
        fail++;
        errors.push(`${row.username || '누락'}: 필수값 누락`);
        continue;
      }
      try {
        await User.findOneAndUpdate(
          { username: row.username },
          {
            username: row.username,
            name: row.name,
            email: row.email,
            phone: row.phone,
            role: row.role || 'general',
            state: row.state || 'temp',
            updateAt: new Date(),
          },
          { upsert: true, new: true }
        );
        success++;
      } catch (e) {
        fail++;
        errors.push(`${row.username}: DB 오류`);
      }
    }
    fs.unlink(req.file.path, () => {});
    res.render('user', {
      title: '회원 목록',
      users: await User.find({}, 'username name email state role'),
      total: await User.countDocuments(),
      page: 1,
      perPage: 10,
      pageCount: 1,
      sort: 'desc',
      startNo: await User.countDocuments(),
      uploadResult: { success, fail, errors },
    });
  } catch (err) {
    console.error('엑셀 업로드 오류:', err);
    res.status(500).send('엑셀 업로드 중 오류가 발생했습니다.');
  }
}; 