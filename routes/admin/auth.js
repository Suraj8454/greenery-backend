const router = require('express').Router();
const c = require('../../controllers/adminController');

router.get('/login', c.loginPage);
router.post('/login', c.loginSubmit);
router.get('/logout', c.logout);
router.post('/api/login', c.login); // API login for external admin panel
router.put('/api/change-password', require('../../middleware/adminMiddleware'), c.changePassword);

module.exports = router;