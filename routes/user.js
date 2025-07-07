const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

module.exports = router; 