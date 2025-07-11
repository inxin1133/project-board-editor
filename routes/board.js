const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

router.get('/', boardController.list);
router.get('/read', boardController.read);
router.get('/write', boardController.writeForm);
router.post('/write', boardController.create);
router.get('/edit', boardController.editForm);
router.post('/edit', boardController.update);
router.post('/like', boardController.toggleLike);
router.post('/delete', boardController.delete);

// 댓글/대댓글 라우트는 별도 comment.js에서 관리

module.exports = router; 