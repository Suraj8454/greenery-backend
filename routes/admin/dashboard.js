const router = require('express').Router();
const c = require('../../controllers/adminController');
const d = require('../../controllers/dashboardController');
const admin = require('../../middleware/adminMiddleware');

router.get('/', admin, c.dashboardView);
router.get('/api/stats', admin, d.stats);

module.exports = router;