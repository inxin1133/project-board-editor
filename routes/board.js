const express = require('express');
const router = express.Router();
const boardController = require('../controllers/boardController');

router.get('/', boardController.list);
router.get('/read', boardController.read);
router.get('/write', boardController.writeForm);
router.post('/write', boardController.create);
router.get('/edit', boardController.editForm);
router.post('/edit', boardController.update);

module.exports = router; 