const User = require('../db/user');
const ContactList = require('../db/contactList');
const Loan = require("../db/loan");
const Admin = require("../db/admin");
const jwt = require('jsonwebtoken');
const Employee = require('../db/employee');

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
    const adminId = decoded.adminID;

    if (!adminId) {
        return { auth: false }
    }

    return { auth: true, adminId }
}

exports.findSingleUser = async (req, res) => {
    try {
        const { username, phone, email } = req.body;

        if (!username && !email && !phone) {
            return res.status(400).json({ ok: false, message: "Provide at least one field" });
        }

        let query = {};
        if (username) query.username = username;
        if (email) query.email = email;
        if (phone) query.phone = phone;

        let user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        const appliedLoanCountUser = await Loan.countDocuments({
            userId: user._id,
            status: "applied",
        });

        // 2️⃣ Contact count for this user
        const contactCountUser = await ContactList.aggregate([
            {
                $match: { userId: user._id }, // filter for this user only
            },
            {
                $project: {
                    _id: 0,
                    count: { $size: "$contacts" },
                },
            },
        ]);

        // If no contactList found, set count = 0
        const count = contactCountUser[0]?.count || 0;
        const finalUserData = {
            ...user.toObject(),
            loanCount: appliedLoanCountUser,
            contactCount: count,
        }

        return res.status(200).json({ ok: true, data: finalUserData, message: "Found user" });

    } catch (error) {
        console.error("FindUser error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
}

exports.fetchStartUpData = async (req, res) => {
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
        const adminId = decoded.adminID;

        if (!adminId) {
            return res.status(401).json({ ok: false, message: "Unauthorized" });
        }

        let userCount = await User.countDocuments();
        const result = await ContactList.aggregate([
            {
                $project: {
                    count: { $size: "$contacts" } // count contacts in each document
                }
            },
            {
                $group: {
                    _id: null,
                    totalContacts: { $sum: "$count" } // sum all counts
                }
            }
        ]);

        const totalContacts = result.length > 0 ? result[0].totalContacts : 0;
        let appliedLoanCount = await Loan.countDocuments({ status: "applied" });
        let sanctionedLoanCount = await Loan.countDocuments({ status: "ongoing" });

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);  // Jan 1, YYYY
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31, YYYY

        const userPerMonth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalUsers: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.month": 1 }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalUsers: 1
                }
            }
        ]);

        const appliedLoanMonth = await Loan.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfYear, $lte: endOfYear },
                    status: "applied",
                },
            },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" } },
                    totalApplied: { $sum: 1 },
                },
            },
            { $sort: { "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    totalApplied: 1,
                },
            },
        ]);

        let listOfAppliedLoans = await Loan.find({ status: "applied" }).select('userId loanType amount createdAt').sort({ createdAt: -1 }).limit(10);
        return res.status(200).json({
            ok: true, data: {
                totalUsers: userCount,
                totalContacts: totalContacts,
                totalAppliedLoans: appliedLoanCount,
                totalSanctionedLoans: sanctionedLoanCount,
                userGraph: userPerMonth,
                appliedLoanGraph: appliedLoanMonth,
                latestAppliedLoans: listOfAppliedLoans
            }
        });

    } catch (error) {
        console.error("StartUp Data Error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
}

exports.fetchLoanList = async (req, res) => {
    try {
        let loanList = await Loan.find().select('loanId loanType amount status createdAt').sort({ createdAt: -1 });
        return res.status(200).json({ ok: true, data: loanList })
    } catch (error) {
        console.error("Loan List Error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
}

exports.getData = async (req, res) => {
    try {
        // Read token from Authorization header


        let userCount = await User.countDocuments();
        let appliedLoanNumber = await Loan.countDocuments({
            status: "applied"
        });

    } catch (error) {

    }
}


exports.appliedLoanLength = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ ok: false, message: "Invalid userId format!" });
        }

        const appliedLoanNumber = await Loan.countDocuments({
            userId: userId,
            status: "applied"
        });

        return res.status(200).json({ ok: true, data: appliedLoanNumber });
    } catch (error) {
        console.log("Applied Loan List Fetch Error: ", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error!" });
    }
}
exports.contactLength = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ ok: false, message: "Invalid userId format!" });
        }

        const contactList = await ContactList.findOne({ userId });

        if (!contactList) {
            return res.status(200).json({ ok: true, data: 0 }); // no contacts found
        }

        const contactLength = contactList.contacts ? contactList.contacts.length : 0;

        return res.status(200).json({ ok: true, data: contactLength });

    } catch (error) {
        console.log("Contact Length Fetch Error: ", error);
        return res.status(500).json({ ok: false, message: "Internal Server Error!" });
    }
}

exports.adminSignUp = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Create new admin
        const newAdmin = await Admin.create({
            email,
            password: password,
            role: "admin"
        });

        res.status(201).json({
            message: "Admin registered successfully",
            admin: {
                id: newAdmin._id,
                email: newAdmin.email,
            },
        });
    } catch (error) {
        console.error("Error in adminSignUp:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.fetchEmployeeList = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        let authCheckData = checkAuthHeader(authHeader);
        if (!authCheckData.auth) {
            res.status(400).json({ ok: false, message: "Invalid Authorization !" });
        }
        let adminId = authCheckData.adminId;

        let checkAdmin = await Admin.countDocuments({ _id: adminId });

        if (!checkAdmin) {
            res.status(400).json({ ok: false, message: "Invalid Access !" });
        }

        let employeeList = await Employee.find().select('id name phone email post department joinDate status');

        let activeEmpList = await Employee.countDocuments({ status: 'active' });

        const departments = await Employee.distinct("department");
        const departmentCount = departments.length;

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const joinedThisMonth = await Employee.countDocuments({
            createdAt: { $gte: firstDay, $lt: nextMonth },
        });

        return res.status(200).json({ ok: true, data: { employeeList, departmentCount, joinedThisMonth, activeNow: activeEmpList } });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
exports.addEmployee = async (req, res) => {
    try {

        let authHeader = req.headers['authorization'];
        let checkAuthValid = checkAuthHeader(authHeader);
        if (!checkAuthValid.auth) {
            return res.status(400).json({ ok: false, message: "Unauthorised Access" });
        }

        const { newEmployee } = req.body;
        // console.log(newEmployee);

        console.log("Before create");
        let newEmpData = await Employee.create(newEmployee);
        console.log("After create");

        console.log(newEmpData);


        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error("Error in addEmployee:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.editEmployee = async (req, res) => {
    try {
        const { _id, id, name, email, phone, department, post, joinDate, status } = req.body;
        console.log("join Date: ",joinDate);
        
        if (_id == "" || id == "" || name == "" || email == "" || phone == "" || department == "" || post == "" || joinDate == "" || status == "") {
            return res.status(400).json({ ok: false, message: "Empty fields" });
        }
        let employeeUpdate = await Employee.findOneAndUpdate({ _id: _id }, {
            id,
            name,
            phone,
            email,
            department,
            post,
            joinDate,
            status
        })
        console.log(employeeUpdate);
        

        return res.status(200).json({ ok: true, message: "Employee Updated!", data: employeeUpdate });

    } catch (error) {
        return res.status(500).json({ ok: false, message: "Internal Server Error" });
    }
}


exports.getUserList = async (req, res) => {
    try {
        let authHeader = req.headers['authorization'];
        let checkAuthValid = checkAuthHeader(authHeader);
        if (!checkAuthValid.auth) {
            return res.status(400).json({ ok: false, message: "Unauthorised Access" });
        }
        let userList = await User.find().select('username email phone isReferred empReferCode salarySlip pan aadhar');

        const updatedUserList = await Promise.all(
            userList.map(async (u) => {
                // 1️⃣ Loan count for this user
                const appliedLoanCountUser = await Loan.countDocuments({
                    userId: u._id,
                    status: "applied",
                });

                // 2️⃣ Contact count for this user
                const contactCountUser = await ContactList.aggregate([
                    {
                        $match: { userId: u._id }, // filter for this user only
                    },
                    {
                        $project: {
                            _id: 0,
                            count: { $size: "$contacts" },
                        },
                    },
                ]);

                // If no contactList found, set count = 0
                const count = contactCountUser[0]?.count || 0;

                return {
                    ...u.toObject(),
                    loanCount: appliedLoanCountUser,
                    contactCount: count,
                    salarySlip: u.salarySlip ? `${process.env.AWS_URL_DOWNLOAD}${u.salarySlip}` : ''
                };
            })
        );

        console.log(updatedUserList);


        return res.status(200).json({ ok: true, userList: updatedUserList })
    } catch (error) {
        return res.status(500).json({ ok: false, message: error.message })
    }
}

exports.getLoanList = async (req, res) => {
    try {
        let authHeader = req.headers['authorization'];
        let checkAuthValid = checkAuthHeader(authHeader);
        if (!checkAuthValid.auth) {
            return res.status(400).json({ ok: false, message: "Unauthorised Access" });
        }

        let loanList = await Loan.find().select().sort({ createdAt: -1 }).lean();

        let totalAmount = loanList.reduce((sum, loan) => sum + (loan.amount || 0), 0);
        console.log(totalAmount);

        let updatedLoanListWithUserDetails = await Promise.all(loanList.map(async (loan) => {
            const userData = await User.findById(loan.userId).select('username email -_id');

            return {
                ...loan,
                customerName: userData.username,
                customerEmail: userData.email,
            }

        }))
        console.log(updatedLoanListWithUserDetails);

        return res.status(200).json({ ok: true, data: updatedLoanListWithUserDetails, amount: totalAmount })

    } catch (error) {
        console.log(error);

        return res.status(500).json({ ok: false, message: error.message })
    }
}

exports.getUserlistwContacts = async (req, res) => {
    try {
        let userList = await User.find().select('username email phone createdAt');
        if (!userList || userList.length == 0) {
            return res.status(400).json({ ok: false, message: "No Users!" });
        }
        let firstUserContactsList = await ContactList.findOne({ userId: userList[0]._id }).select('contacts -_id');

        const updatedUserList = await Promise.all(
            userList.map(async (u) => {

                // 2️⃣ Contact count for this user
                const contactCountUser = await ContactList.aggregate([
                    {
                        $match: { userId: u._id }, // filter for this user only
                    },
                    {
                        $project: {
                            _id: 0,
                            count: { $size: "$contacts" },
                        },
                    },
                ]);

                // If no contactList found, set count = 0
                const count = contactCountUser[0]?.count || 0;

                return {
                    ...u.toObject(),
                    totalContacts: count,
                };
            })
        );
        console.log(firstUserContactsList);

        res.status(200).json({ ok: true, userlist: updatedUserList, firstUserContacts: firstUserContactsList.contacts });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, message: error.message })
    }
}

exports.getConatcListforUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400), json({ ok: false, message: "Provide User Id" });
        }
        let findContacts = await ContactList.findOne({ userId: userId });
        if (!findContacts) {
            return res.status(400), json({ ok: false, message: "No Contacts" });
        }
        return res.status(200).json({ ok: true, data: findContacts.contacts })

    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, message: error.message })
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ ok: false, message: "userId is required" });
        }

        // run all deletions together
        const [userRes, loanRes, contactRes] = await Promise.all([
            User.deleteOne({ _id: userId }),
            Loan.deleteMany({ userId }),
            ContactList.deleteOne({ userId }),
        ]);

        if (userRes.deletedCount === 0) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        return res.status(200).json({
            ok: true,
            message: "User and related data deleted successfully",
            deleted: {
                user: userRes.deletedCount,
                loans: loanRes.deletedCount,
                contactList: contactRes.deletedCount,
            },
        });
    } catch (err) {
        console.error("deleteUser error:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { empId } = req.body;
        if (!empId) {
            return res.status(400).json({ ok: false, message: "Employee Id is required" });
        }
        await Employee.deleteOne({ _id: empId });

        return res.status(200).json({ ok: true });
    }
    catch {
        console.error("delete employee error:", err);
        return res.status(500).json({ ok: false, message: err.message });
    }
}