const express = require('express');
const router = express.Router();
const editorController = require('../controllers/editorController');

// 로그인 체크 미들웨어 (임시로 비활성화)
const requireAuth = (req, res, next) => {
  // 임시로 인증 체크 비활성화
  next();
};

// Editor 게시판 목록
router.get('/', requireAuth, editorController.getEditorList);

// Editor 게시글 작성 페이지
router.get('/write', requireAuth, editorController.getEditorWrite);

// Editor 게시글 작성 처리
router.post('/write', requireAuth, editorController.postEditorWrite);

// Editor 게시글 상세 보기
router.get('/view/:id', requireAuth, editorController.getEditorView);

// Editor 게시글 수정 페이지
router.get('/edit/:id', requireAuth, editorController.getEditorEdit);

// Editor 게시글 수정 처리
router.post('/edit/:id', requireAuth, editorController.postEditorEdit);

// Editor 게시글 삭제
router.delete('/delete/:id', requireAuth, editorController.deleteEditor);

module.exports = router; 