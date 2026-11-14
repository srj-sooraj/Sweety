const express = require('express');
const reportController = require('../controllers/reportController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.get('/daily', reportController.daily);
router.get('/month-to-date', reportController.monthToDate);
router.get('/previous-month', reportController.previousMonth);

module.exports = router;
