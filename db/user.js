const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
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
    pan: {
        type: String,
        unique: true,
        sparse: true
    },
    aadhar: {
        type: Number,
        unique: true,
        sparse: true
    },
    cibil_score: {
        type: Number,
        unique: true,
        sparse: true
    },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(`${this.password}`, salt);
    this.Password = hash;
    next();
});
UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.Password);
};
// UserSchema.methods.SignAccessToken = function () {
//     return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
// };
// UserSchema.methods.SignRefreshToken = async function () {
//     return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
// };

module.exports = mongoose.model('User', UserSchema);
