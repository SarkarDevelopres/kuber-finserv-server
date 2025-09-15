// db/contactList.js
const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    sourceId: { type: String, required: true }, // device contact id
    name: { type: String, default: '' },
    phones: [{ type: String }],                 // E.164 numbers
    emails: [{ type: String }],
  },
  { _id: false }
);

const ContactListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, required: true, unique: true, index: true },
    contacts: { type: [ContactSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactList', ContactListSchema);
