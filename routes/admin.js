const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin');

router.post('/register', adminController.register_post);
router.post('/update', adminController.update_profile_post);
router.get('/logout', adminController.logout);
router.get("/verify/accept/:id", adminController.verifyAccept)
router.get("/verify/reject/:id", adminController.verifyRejected)
router.post("/add/category", adminController.addCategory_post)

// UI
router.get("/dashboard", adminController.renderDashboard)

module.exports = router;
