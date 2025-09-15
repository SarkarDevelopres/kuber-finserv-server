const { getUploadUrl } = require("../services/s3Service.js");
const User = require('../db/user');
const ContactList = require('../db/contactList'); 

exports.uploadSalarySlip = async (req, res) => {
    try {
        const { fileName, fileType, email } = req.body;

        let user = await User.findOne({ email: email });

        const userId = user._id;

        const { uploadUrl, key } = await getUploadUrl(userId, fileName, fileType);

        // Save key reference in DB against user
        await User.findByIdAndUpdate(userId, { salarySlip: key });

        res.json({ uploadUrl, key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate S3 upload URL" });
    }
}

exports.createUser = async (req, res) => {
    try {
        console.log("I am called");
        
        const { name, email, phone } = req.body;

        console.log(req.body);
        

        let isUser = await User.findOne({
            $or: [{ email: email }, { phone: phone }]
        });

        if (isUser) {
            return res.status(409).json({ ok: false, message: "User already exists" });
        }

        await User.create({
            username: name,
            email: email,
            phone: phone
        });

        return res.status(201).json({ ok: true, message: "Account created successfully" });
    } catch (error) {
        console.error("User creation error:", error);
        res
            .status(500)
            .json({ ok: false, message: error.message || error, success: false });
    }
};


exports.completeKYC = async (req, res) => {
    try {
        const { email, pan, aadhar, address } = req.body;

        console.log(address);
        let noAadhar = parseInt(aadhar);
        let objAddress = JSON.parse(address)
        

        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { pan, aadhar:noAadhar, address:objAddress } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ ok: false, message: "User not found" });
        }

        res.status(200).json({ ok: true, message: "KYC Completed!", user });
    } catch (error) {
        console.error("KYC update error:", error);
        res
            .status(500)
            .json({ ok: false, message: error.message || error, success: false });
    }
};

exports.syncContacts = async (req, res) => {
  try {
    const { email, contacts } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: "email is required" });
    }
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ ok: false, message: "contacts array is required" });
    }

    const user = await User.findOne({ email }).select('_id');
    if (!user) {
      return res.status(404).json({ ok: false, message: "User not found" });
    }

    // sanitize + cap payload
    const MAX_CONTACTS = 5000;
    const cleanContacts = contacts.slice(0, MAX_CONTACTS).map((c) => {
      const sourceId = String(c?.sourceId || '').trim();
      if (!sourceId) return null;

      const name = String(c?.name || '').trim().slice(0, 200);

      const phones = Array.isArray(c?.phones)
        ? Array.from(
            new Set(
              c.phones
                .map((p) => String(p || '').trim())
                .filter(Boolean)
            )
          ).slice(0, 10)
        : [];

      const emails = Array.isArray(c?.emails)
        ? Array.from(
            new Set(
              c.emails
                .map((e) => String(e || '').trim().toLowerCase())
                .filter(Boolean)
            )
          ).slice(0, 10)
        : [];

      return { sourceId, name, phones, emails };
    }).filter(Boolean);

    // upsert/merge
    let doc = await ContactList.findOne({ userId: user._id });
    if (!doc) {
      doc = await ContactList.create({
        userId: user._id,
        contacts: cleanContacts
      });
      return res.json({ ok: true, created: cleanContacts.length, updated: 0, total: cleanContacts.length });
    }

    // Merge by sourceId
    const byId = new Map(doc.contacts.map((c) => [c.sourceId, c]));
    let created = 0, updated = 0;

    for (const c of cleanContacts) {
      const existing = byId.get(c.sourceId);
      if (!existing) {
        byId.set(c.sourceId, c);
        created++;
      } else {
        let changed = false;

        if (c.name && c.name !== existing.name) {
          existing.name = c.name;
          changed = true;
        }

        if (c.phones && c.phones.length) {
          const mergedPhones = Array.from(new Set([...(existing.phones || []), ...c.phones])).slice(0, 10);
          if (JSON.stringify(mergedPhones) !== JSON.stringify(existing.phones || [])) {
            existing.phones = mergedPhones;
            changed = true;
          }
        }

        if (c.emails && c.emails.length) {
          const mergedEmails = Array.from(new Set([...(existing.emails || []), ...c.emails])).slice(0, 10);
          if (JSON.stringify(mergedEmails) !== JSON.stringify(existing.emails || [])) {
            existing.emails = mergedEmails;
            changed = true;
          }
        }

        if (changed) updated++;
      }
    }

    const merged = Array.from(byId.values());
    await ContactList.updateOne({ userId: user._id }, { $set: { contacts: merged } });

    return res.json({ ok: true, created, updated, total: merged.length });
  } catch (error) {
    console.error("contacts sync error:", error);
    return res.status(500).json({ ok: false, message: error.message || "contacts sync failed" });
  }
};

exports.applyLoan = async (req, res) => {
    try {
        const { amount, tenure, interest, email } = req.body;
        let user = await User.findOne({ email: email }).select('_id phone');
        if (!user) {
            res.status(409).json({ ok: false, message: "User don't exist !" })
        }
        let loanApply = await Loan.create({
            userID: user._id,
            phone: user.phone,
            amount: amount,
            tenure: tenure,
            interest: interest
        })
        res.status(200).json({ ok: true, message: "Loan applied !" })
    } catch (error) {
        console.error("Loan apply error:", error);
        res
            .status(500)
            .json({ ok: false, message: error.message || error, success: false });
    }
}