const express = require('express');
const router = express.Router();

const workerController = require('../controllers/worker');

router.post('/add/category', workerController.addCategory);
router.post('/update', workerController.update_profile_post);

router.post('/task/show/intrest/:id', workerController.showTaskInterest);
router.post('/negotiate/task/price/:id', workerController.negotiateTaskPrice);

router.get('/logout', workerController.logout);

// UI
router.get('/home', workerController.renderHome);
router.get('/mywork', workerController.renderMyWorks);
router.get('/task/:id', workerController.renderTaskWithID);
router.get('/notification', workerController.renderNotification);
router.get('/profile', workerController.renderProfile);


module.exports = router;
