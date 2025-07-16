const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const User = require('../schemas/userSchema'); // 유저 스키마 임포트

// 사용자 관련 라우트
router.get('/', authController.userList);
router.get('/view', authController.userDetail);
router.get('/userView', authController.userViewSelf);
// router.get('/edit', async (req, res) => {
//   if (!req.session.userId) return res.redirect('/');
//   const user = await User.findById(req.session.userId).populate('profileImage');
//   res.render('userEdit', { title: '회원정보 수정', user });
// });
router.post('/state', authController.updateUserState);
router.post('/role', authController.updateUserRole);
router.post('/edit-info', upload.single('profileImage'), authController.editInfo);
router.post('/change-password', authController.changePassword);
router.post('/2fa', authController.update2faStatus);
router.get('/excel-template', authController.downloadExcelTemplate);
router.post('/upload-excel', upload.single('excelFile'), authController.uploadExcel);

// 아이디 중복 체크
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.json({ available: false, message: '아이디를 입력하세요.' });
  const exists = await User.exists({ username });
  if (exists) {
    return res.json({ available: false, message: '이미 사용 중인 아이디입니다.' });
  }
  return res.json({ available: true, message: '사용 가능한 아이디입니다.' });
});

// 이메일 중복 체크
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ available: false, message: '이메일을 입력하세요.' });
  const exists = await User.exists({ email });
  if (exists) {
    return res.json({ available: false, message: '이미 사용 중인 이메일입니다.' });
  }
  return res.json({ available: true, message: '사용 가능한 이메일입니다.' });
});

module.exports = router; 