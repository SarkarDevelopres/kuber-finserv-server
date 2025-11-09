const Admin = require('../db/admin');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Employee = require('../db/employee');
dotenv.config();


exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(req.body);

        let emp = await Admin.findOne({ email: email }).select('password');
        if (!emp) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }

        if (emp.password != password) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }
        const token = jwt.sign(
            { adminID: emp._id }, // payload
            process.env.JWT_SECRET,        // secret key
            { expiresIn: '1d' }            // expiry
        );

        // console.log(req.body);
        res.status(201).json({ message: 'Admin logged In', ok: true, token });
    } catch (error) {
        console.error("Login error:", error);
        res
            .status(500)
            .json({ ok: false, message: error.message || error, success: false });
    }
}
exports.empLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(req.body);

        let emp = await Employee.findOne({ email: email }).select('password name');
        if (!emp) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }

        if (emp.password != password) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }
        const token = jwt.sign(
            { empID: emp._id }, // payload
            process.env.JWT_SECRET,        // secret key
            { expiresIn: '1d' }            // expiry
        );


        // console.log(req.body);
        res.status(201).json({ message: `Welcome ${emp.name}!`, ok: true, token, name: emp.name });
    } catch (error) {
        console.error("Login error:", error);
        res
            .status(500)
            .json({ ok: false, message: error.message || error, success: false });
    }
}