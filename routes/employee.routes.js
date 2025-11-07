// auth.routes
const express = require('express');
const router = express.Router();
const EmpController = require('../controllers/emp.controller');

router.get('/startUpData',EmpController.getStartUpData);

module.exports = router;