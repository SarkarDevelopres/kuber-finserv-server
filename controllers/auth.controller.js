const Admin = require('../db/admin');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();


exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(req.body);
        
        let admin = await Admin.findOne({ email: email }).select('password');
        if (!admin) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }

        if (admin.password != password) {
            return res.status(400).json({ message: 'Invalid Credentials', success: false });
        }
        const token = jwt.sign(
            { adminID: admin._id }, // payload
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