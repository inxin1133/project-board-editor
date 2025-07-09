const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// 사용자 관련 라우트
router.get('/', authController.userList);
router.get('/view', authController.userDetail);
router.get('/edit', (req, res) => {
  res.render('userEdit', { title: '회원정보 수정' });
});
router.post('/state', authController.updateUserState);
router.post('/role', authController.updateUserRole);
router.post('/edit-info', authController.editInfo);
router.post('/change-password', authController.changePassword);
router.post('/2fa', authController.update2faStatus);
router.get('/excel-template', authController.downloadExcelTemplate);
router.post('/upload-excel', upload.single('excelFile'), authController.uploadExcel);

module.exports = router; 