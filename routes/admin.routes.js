// admin.routes
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

router.post('/fetchUserDetails',AdminController.fetchUserData);

module.exports = router;