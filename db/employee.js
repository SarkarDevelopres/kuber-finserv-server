const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmployeeSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: Number,
        required: true
    },
    phone: {
        type: Number,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    post: {
        type: String,
    },
    department: {
        type: String,
    },
    address: {
        type: Object
    },
    status: {
        type: String,
        enum: ["active", "inactive", "terminated", "on_leave", "probation"],
    },
    joinDate: {
        type: String
    },
    salarySlip: {
        type: String
    },
    notification: {
        type: Boolean
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// EmployeeSchema.pre('save', async function (next) {
//     var salt = bcrypt.genSaltSync(10);
//     var hash = bcrypt.hashSync(`${this.password}`, salt);
//     this.Password = hash;
//     next();
// });
// EmployeeSchema.methods.comparePassword = async function (enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.Password);
// };
// EmployeeSchema.methods.SignAccessToken = function () {
//     return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
// };
// EmployeeSchema.methods.SignRefreshToken = async function () {
//     return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
// };

module.exports = mongoose.model('Employee', EmployeeSchema);
