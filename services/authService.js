const bcrypt = require('bcrypt');
const User = require('../schemas/userSchema');
const { utils } = require('../controllers/index');

exports.signup = async ({ username, password, email, name, phone }) => {
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    existing.createAt = new Date();
    await existing.save();
    throw new Error('이미 존재하는 아이디 또는 이메일입니다.');
  }
  const code = utils.generate2faCode();
  await utils.sendEmail(email, '[ProjectBoard-editor] 회원가입 2차 인증코드', `인증코드: ${code}`);
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
  return { user, code };
};

exports.verify2fa = async (userId) => {
  return await User.findByIdAndUpdate(userId, { is2faVerified: true }, { new: true });
};

exports.login = async ({ username, password }) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error('존재하지 않는 아이디입니다.');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('비밀번호가 일치하지 않습니다.');
  // 로그인 성공 시 lastLogin 갱신
  user.lastLogin = new Date();
  await user.save();
  return user;
};

exports.send2faCode = async (user) => {
  const code = utils.generate2faCode();
  await utils.sendEmail(user.email, '[ProjectBoard-editor] 2차 인증코드 재발송', `인증코드: ${code}`);
  return code;
};

exports.findId = async ({ name, email }) => {
  const user = await User.findOne({ name, email });
  if (!user) throw new Error('입력한 정보가 없습니다.');
  await utils.sendEmail(email, '[ProjectBoard-editor] 아이디 찾기 결과', `회원님의 아이디는 [${user.username}] 입니다.`);
  return user;
};

exports.findPw = async ({ username, email }) => {
  const user = await User.findOne({ username, email });
  if (!user) throw new Error('입력한 정보가 없습니다.');
  const tempPassword = utils.generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 10);
  user.password = hash;
  user.tempPassword = tempPassword;
  await user.save();
  await utils.sendEmail(email, '[ProjectBoard-editor] 임시 비밀번호 안내', `임시 비밀번호: ${tempPassword}\n로그인 후 반드시 비밀번호를 변경해 주세요.`);
  return user;
};

exports.changePw = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('사용자 없음');
  const hash = await bcrypt.hash(newPassword, 10);
  user.password = hash;
  user.tempPassword = undefined;
  await user.save();
  return user;
};

// 기타 회원 상태/권한/정보 변경 등도 유사하게 추가 가능 