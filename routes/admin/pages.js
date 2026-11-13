const router = require('express').Router();
const c = require('../../controllers/adminController');
const admin = require('../../middleware/adminMiddleware');

router.get('/', admin, c.pagesView);
router.get('/:slug/edit', admin, c.pageEditView);
router.post('/:slug', admin, c.updatePage);

module.exports = router;