// auth.routes
const express = require('express');
const router = express.Router();
const EmpController = require('../controllers/emp.controller');

router.get('/authCheck',EmpController.authCheck);
router.get('/startUpData',EmpController.getStartUpData);
router.get('/fetchUsers',EmpController.fetchUsers);
router.get('/fetchLoanList',EmpController.fetchLoanList);
router.get('/fetchMessages',EmpController.fetchMessages);
router.post('/markAsRead',EmpController.markAsRead);
router.post('/replyMessage',EmpController.replyMessage);

module.exports = router;