// const router = require('express').Router();
// const c = require('../../controllers/adminController');
// const admin = require('../../middleware/adminMiddleware');

// router.get('/', admin, c.settingsView);
// router.post('/site', admin, require('../../controllers/storeController').saveSettings);

// module.exports = router;


const router = require('express').Router();

const c = require('../../controllers/adminController');
const admin = require('../../middleware/adminMiddleware');

const storeController = require('../../controllers/storeController');
const logoUpload = require('../../middleware/logoUpload');

router.get('/', admin, c.settingsView);

router.post(
  '/site',
  admin,
  logoUpload.single('website_logo'),
  storeController.saveSettings
);

module.exports = router;
