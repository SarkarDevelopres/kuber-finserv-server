const Employee = require('../db/employee');
const User = require('../db/user');
const Loan = require('../db/loan');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Message = require('../db/message');
const { getIO } = require("../socket");
dotenv.config();

function checkAuthHeader(authHeader) {
    if (!authHeader) {
        return { auth: false }
    }
    // Format: "Bearer <token>"
    const token = authHeader.split(" ")[1];
    if (!token) {
        console.log("Invalid Admin Token, probable attack.");
        return { auth: false }
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const empId = decoded.empID;

    if (!empId) {
        return { auth: false }
    }

    return { auth: true, empId }
}

exports.authCheck = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        let empId = authCheckData.empId;

        let empCode = await Employee.findById(empId).select('id').lean();

        return res.status(200).json({ ok: true, id: empCode.id });
    } catch (error) {
        console.log("Employee auth error: ", error);
        return res.status(500).json({ ok: false, id: null });
    }
}

exports.getStartUpData = async (req, res) => {
    try {

        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        if (!authCheckData.auth) {
            res.status(400).json({ ok: false, message: "Invalid Authorization !" });
        }

        let empId = authCheckData.empId;

        if (!empId) return res.status(400).json({ ok: false, message: "Invalid Access !" });

        // 🔹 Get Employee
        const empData = await Employee.findById(empId)
            .select('id notification -_id')
            .lean();
        if (!empData) throw new Error("Employee not found");

        // 🔹 Get users referred by this employee
        const employeeUserList = await User.find({ empReferCode: empData.id })
            .select('_id')
            .lean();

        if (employeeUserList.length === 0) {
            return res.status(200).json({
                ok: true,
                userCount: 0,
                result: {},
                userGraph: [],
                loanGraph: []
            });
        }

        const userIds = employeeUserList.map(u => u._id);

        // 🔹 Loan stats by status
        const loanStats = await Loan.aggregate([
            { $match: { userId: { $in: userIds } } },
            { $group: { _id: "$status", totalLoans: { $sum: 1 } } }
        ]);

        const result = loanStats.reduce((acc, cur) => {
            acc[cur._id] = cur.totalLoans;
            return acc;
        }, {});

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

        // 🔹 Users per month
        const userPerMonth = await User.aggregate([
            {
                $match: {
                    empReferCode: empData.id,
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalUsers: 1
                }
            }
        ]);

        const loans = await Loan.find({ userId: { $in: userIds } }).lean();

        // 🔹 Loans per month (status = applied)
        const appliedLoanMonth = await Loan.aggregate([
            {
                $match: {
                    userId: { $in: userIds },
                    createdAt: { $gte: startOfYear, $lte: endOfYear },
                    status: "applied"
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalApplied: { $sum: 1 }
                }
            },
            { $sort: { "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalApplied: 1
                }
            }
        ]);

        // 🔹 Response
        return res.status(200).json({
            ok: true,
            userCount: employeeUserList.length,
            result,
            loans: loans,
            userGraph: userPerMonth,
            loanGraph: appliedLoanMonth,
            notification: empData.notification ? empData.notification : false
        });

    } catch (error) {
        console.error("getStartUpData error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Server error"
        });
    }
};


exports.fetchUsers = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        if (!authCheckData.auth) {
            res.status(400).json({ ok: false, message: "Invalid Authorization !" });
        }

        let empId = authCheckData.empId;

        if (!empId) return res.status(400).json({ ok: false, message: "Invalid Access !" });

        // 🔹 Get Employee
        const empData = await Employee.findById(empId)
            .select('id -_id')
            .lean();
        if (!empData) throw new Error("Employee not found");

        // 🔹 Get users referred by this employee
        const employeeUserList = await User.find({ empReferCode: empData.id })
            .select('username email phone isReferred empReferCode salarySlip pan aadhar')
            .lean();

        if (!employeeUserList.length) {
            return res.status(200).json({ ok: true, message: "No users found.", userList: [] });
        }

        const updatedUserList = await Promise.all(
            employeeUserList.map(async (u) => {
                // 1️⃣ Loan count for this user
                const appliedLoanCountUser = await Loan.countDocuments({
                    userId: u._id,
                    status: "applied",
                });

                return {
                    ...u,
                    loanCount: appliedLoanCountUser,
                    salarySlip: u.salarySlip ? `${process.env.AWS_URL_DOWNLOAD}${u.salarySlip}` : ''
                };
            })
        );

        return res.status(200).json({ ok: true, message: "Users found.", userList: updatedUserList });


    } catch (error) {
        console.error("userListFetch error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Server error"
        });
    }
}

exports.fetchLoanList = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        if (!authCheckData.auth) {
            res.status(400).json({ ok: false, message: "Invalid Authorization !" });
        }

        let empId = authCheckData.empId;

        if (!empId) return res.status(400).json({ ok: false, message: "Invalid Access !" });


        // 🔹 Get Employee
        const empData = await Employee.findById(empId)
            .select('id -_id')
            .lean();
        if (!empData) throw new Error("Employee not found");

        // 🔹 Get users referred by this employee
        const employeeUserList = await User.find({ empReferCode: empData.id })
            .select('_id')
            .lean();

        if (!employeeUserList.length) {
            return res.status(400).json({ ok: false, message: "No users found.", loanList: [] });
        }

        const userIds = employeeUserList.map(u => u._id);

        const loans = await Loan.find({ userId: { $in: userIds } }).lean();

        if (!loans.length) {
            return res.status(400).json({ ok: false, message: "No loans found.", loanList: [] });
        }

        let updatedLoanListWithUserDetails = await Promise.all(loans.map(async (loan) => {
            const userData = await User.findById(loan.userId).select('username email -_id');

            return {
                ...loan,
                customerName: userData.username,
                customerEmail: userData.email,
            }

        }))

        let totalAmount = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);

        return res.status(200).json({ ok: true, message: "Loans found.", loanList: updatedLoanListWithUserDetails, amount: totalAmount });


    } catch (error) {
        console.error("loanListFetch error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Server error"
        });
    }
}

exports.fetchMessages = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        if (!authCheckData.auth) {
            res.status(400).json({ ok: false, message: "Invalid Authorization !" });
        }

        let empId = authCheckData.empId;

        if (!empId) return res.status(400).json({ ok: false, message: "Invalid Access !" });


        // 🔹 Get Employee
        const empData = await Employee.findById(empId)
            .select('id -_id')
            .lean();
        if (!empData) throw new Error("Employee not found");

        const employeeUserList = await User.find({ empReferCode: empData.id })
            .select('_id')
            .lean();

        if (!employeeUserList.length) {
            return res.status(400).json({ ok: false, message: "No users found.", loanList: [] });
        }

        const userIds = employeeUserList.map(u => u._id);

        const messages = await Message.find({ userId: { $in: userIds }, type:"message" })
        .sort({createdAt: -1})
        .lean();

        let updatedMessageWithUserDetails = await Promise.all(messages.map(async (message) => {
            const userData = await User.findById(message.userId).select('username email phone -_id');

            return {
                ...message,
                username: userData.username,
                email: userData.email,
                phone: userData.phone,
            }

        }))

        await Employee.findByIdAndUpdate(empId, { notification: false });

        return res.status(200).json({ ok: true, messages: updatedMessageWithUserDetails });

    } catch (error) {
        console.error("fetch message employee error:", error);
        return res.status(500).json({
            ok: false,
            message: error.message || "Server error"
        });
    }
}

exports.markAsRead = async (req, res) => {
    try {
        let authHeader = req.headers['authorization'];
        let checkAuthValid = checkAuthHeader(authHeader);
        if (!checkAuthValid.auth) {
            return res.status(400).json({ ok: false, message: "Unauthorised Access" });
        }

        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ ok: false, message: "Message identifier missing." });
        }

        let updatedMessage = await Message.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();

        await User.findByIdAndUpdate(updatedMessage.userId, { notification: true });

        const io = getIO();
        console.log(updatedMessage.userId);
        
        io.to(`user:${updatedMessage.userId}`).emit("notification", { notification: true });


        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error("mark as read message employee error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
}

exports.replyMessage = async (req, res) => {
    try {
        let authHeader = req.headers['authorization'];
        let checkAuthValid = checkAuthHeader(authHeader);
        if (!checkAuthValid.auth) {
            return res.status(400).json({ ok: false, message: "Unauthorised Access" });
        }

        let empId = checkAuthValid.empId;

        if (!empId) return res.status(400).json({ ok: false, message: "Invalid Access !" });

        // 🔹 Get Employee
        const empData = await Employee.findById(empId)
            .select('id -_id')
            .lean();
        if (!empData) throw new Error("Employee not found");

        const { id, reply } = req.body;

        if (!id || !reply) {
            return res.status(400).json({ ok: false, message: "Invalid Reply!" });
        }

        let replyTime = new Date();

        let repliedMessage = await Message.findByIdAndUpdate(id, {
            isAnswered: true,
            replyText: reply,
            replyBy: empData.id,
            replyTime: replyTime
        }, {
            new: true
        }).lean();

        await User.findByIdAndUpdate(repliedMessage.userId, { notification: true });

        const io = getIO();
        io.to(`user:${repliedMessage.userId}`).emit("notification", { notification: true });

        return res.status(200).json({ ok: true, newMesageData: repliedMessage });


    } catch (error) {
        console.error("reply message employee error:", error);
        return res.status(500).json({ ok: false, message: error.message });
    }
}