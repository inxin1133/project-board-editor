const express = require('express');
const router = express.Router();
const attachmentController = require('../controllers/attachmentController');

router.post('/delete', attachmentController.delete);
router.post('/deleteAll', attachmentController.deleteAll);
router.get('/downloadAll', attachmentController.downloadAll);
router.get('/:id/download', attachmentController.download);

module.exports = router; 