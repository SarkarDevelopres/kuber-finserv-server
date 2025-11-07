// admin.routes
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

router.post('/findSingleUser',AdminController.findSingleUser);
router.get('/fetchStartUpData',AdminController.fetchStartUpData);
router.get('/fetchLoanList',AdminController.getLoanList);
router.post('/fetchConatcListforUser',AdminController.getConatcListforUser);
router.get('/fetchUserwContact',AdminController.getUserlistwContacts);
router.post('/adminsignup',AdminController.adminSignUp);
router.get('/fetchEmployee',AdminController.fetchEmployeeList);
router.get('/fetchUser',AdminController.getUserList);
router.post('/addEmployee',AdminController.addEmployee);
router.post('/editEmployee',AdminController.editEmployee);
router.post('/deleteEmployee',AdminController.deleteEmployee);
router.post('/deleteUser',AdminController.deleteUser);

module.exports = router;