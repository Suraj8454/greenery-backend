const router = require('express').Router();
const c = require('../../controllers/pageController');

router.get('/:slug', c.get);
router.post('/contact', c.contact);

module.exports = router;