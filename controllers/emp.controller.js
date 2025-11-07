const Employee = require('../db/employee');
const User = require('../db/user');
const Loan = require('../db/loan');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

exports.getStartUpData = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ ok: false, message: "No token provided" });
        }

        // Format: "Bearer <token>"
        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({ ok: false, message: "Invalid token format" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const empId = decoded.empID;

        if (!empId) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        const empData = await Employee.findById(empId)
            .select('id -_id')
            .lean();

        if (!empData) throw new Error("Employee not found");

        const employeeUserList = await User.find({ empReferCode: empData.id })
            .select('_id username phone email')
            .lean();

        const userLoanApplied = await Promise.all(
            employeeUserList.map(async (user) => {
                const loans = await Loan.find({ userId: user._id }).lean();
                return { user, loans };
            })
        );

        // Optional: flatten loans if you just want an array of all loans
        const allLoans = userLoanApplied.flatMap(u => u.loans);

    } catch (error) {

    }
}