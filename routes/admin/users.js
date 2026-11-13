const router = require('express').Router();
const c = require('../../controllers/adminController');
const admin = require('../../middleware/adminMiddleware');

router.get('/', admin, c.usersView);
router.post('/:id/delete', admin, c.deleteUser);

module.exports = router;