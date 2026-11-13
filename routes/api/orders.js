const router = require('express').Router();
const c = require('../../controllers/orderController');
const auth = require('../../middleware/authMiddleware');

router.post('/', auth, c.place);
router.get('/', auth, c.myOrders);

module.exports = router;