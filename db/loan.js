// db/loan.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
    {
        loanId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        amount: { type: Number, required: true },
        tenure: { type: Number, required: true },
        emi: { type: Number, required: true },
        unit: { type: String, enum: ["year", "month"], default: "month" },
        interest: { type: Number, required: true },
        loanType: { type: String },
        status: { type: String },
        paidTill: { type: Number, default: 0 },
        progress: { type: Number, default: 0 },
        dueDate: { type: Date },
    },
    { timestamps: true }
);


module.exports = mongoose.model('Loan', LoanSchema);
