// user.routes
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.post('/fetchUserDetails',UserController.uploadSalarySlip)
router.post('/createuser',UserController.createUser)
router.post('/storekyc',UserController.completeKYC)
router.post('/contacts',UserController.syncContacts)

module.exports = router;