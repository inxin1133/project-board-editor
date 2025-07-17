const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/write', commentController.write);
router.post('/delete', commentController.delete);
router.post('/edit', commentController.edit);

module.exports = router; 