const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');

router.post('/register', adminController.register_post);
router.post('/login', adminController.login_post);
router.post('/update', adminController.update_profile_post);
router.post('/logout', adminController.logout);
router.get("/verify/accept/:id", adminController.verifyAccept)
router.post("/verify/reject/:id", adminController.verifyRejected)

module.exports = router;
