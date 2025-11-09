const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
        minlength: [6, "Password should have atleast 6 characters"],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'sub-admin'],
        required: true
    },
    notification: {
        type: Boolean
    },
    blocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

AdminSchema.index(
    { role: 1 },
    { unique: true, partialFilterExpression: { role: 'admin' } }
);

AdminSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};

module.exports = mongoose.model('Admin', AdminSchema);
