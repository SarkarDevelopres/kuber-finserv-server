// user.routes
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.post('/fetchUserDetails',UserController.uploadSalarySlip)
router.post('/createuser',UserController.createUser)
router.post('/storekyc',UserController.completeKYC)
router.post('/contacts',UserController.syncContacts)
router.post('/uploadSalarySlip',UserController.uploadSalarySlip)
router.post('/applyLoan',UserController.applyLoan)
router.post('/fetchLoans',UserController.fetchLoans)
router.get('/getNumber',UserController.getNumber)
router.post('/sendMessage',UserController.sendMessage)
router.post('/fetchMessages',UserController.fetchMessages)
router.post('/getNotification',UserController.getNotification)

router.get('/getUserList',UserController.getUserList)
router.post('/appliedLoanLength',UserController.appliedLoanLength)
router.post('/contactLength',UserController.contactLength)

module.exports = router;