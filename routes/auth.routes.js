// auth.routes
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/adminLogin',AuthController.adminLogin);

module.exports = router;