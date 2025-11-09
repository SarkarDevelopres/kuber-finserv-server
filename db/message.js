// db/loan.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        reason: { type: String },
        subject: { type: String, required: true },
        message: { type: String },
        type: { type: String, enum: ["message", "notification"], default: "message" },
        isRead: { type: Boolean, default: false },
        isAnswered: { type: Boolean, default: false },
        replyText: { type: String },
        replyBy: { type: String },
        replyTime: { type: Date }
    },
    { timestamps: true }
);


module.exports = mongoose.model('Message', MessageSchema);
