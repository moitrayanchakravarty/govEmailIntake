const mongoose = require('mongoose');





// Schema to log past custodians for role-based accounts (REG-01, REG-03)
const CustodianHistorySchema = new mongoose.Schema({
    holderName: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: mongoose.Schema.Types.Mixed,
        default: "ongoing" // Will be replaced with a Date when they hand over the account
    }
}, { _id: false });







// Main Master Email Assignment Registry Schema (REG-01)
const MasterRegistrySchema = new mongoose.Schema({
    emailAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive', 'Role-based'] // Categorized statuses per SRS
    },
    officeName: {
        type: String,
        required: true
    },
    creationDate: {
        type: Date,
        default: Date.now
    },

    // Current occupant using the email address (REG-01)
    currentCustodian: {
        name: { type: String, required: true },
        designation: { type: String, required: true },
        mobile: { type: String, required: true },
        dob: { type: Date, required: true },
        retirementDate: { type: Date, required: true }
    },

    // Append-only chronological list tracking historical users (REG-01)
    custodianHistory: [CustodianHistorySchema]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});





module.exports = mongoose.model('MasterRegistry', MasterRegistrySchema);


//Done by Tinku Moni Kaushik , in 15th July , 2026