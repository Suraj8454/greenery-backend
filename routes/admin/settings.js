const router = require('express').Router();
const c = require('../../controllers/adminController');
const admin = require('../../middleware/adminMiddleware');

router.get('/', admin, c.settingsView);
router.post('/site', admin, require('../../controllers/storeController').saveSettings);

module.exports = router;