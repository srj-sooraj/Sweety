const express = require('express');
const readingController = require('../controllers/readingController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/', readingController.create);
router.get('/', readingController.list);
router.get('/:id', readingController.getOne);
router.put('/:id', readingController.update);
router.delete('/:id', readingController.remove);

module.exports = router;
