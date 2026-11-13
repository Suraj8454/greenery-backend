const router = require('express').Router();
const c = require('../../controllers/authController');
const auth = require('../../middleware/authMiddleware');

router.post('/send-otp', c.sendOtp);
router.post('/verify-otp', c.verifyOtp);
router.post('/signup', c.signup);
router.get('/me', auth, c.me);

module.exports = router;