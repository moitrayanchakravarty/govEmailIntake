const mongoose = require('mongoose');

// Regular Expression to enforce official Assam Government email domain validation
const GOV_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@assam\.gov\.in$/;




const CustodianHistorySchema = new mongoose.Schema({
    holderName: { type: String, required: true },
    designation: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: mongoose.Schema.Types.Mixed, default: "ongoing" },
    // Free-text note on *why* the custodian changed (handover, retirement,
    // transfer, etc.) — populated automatically when a Modification /
    // Deletion request against this account is approved.
    changeReason: { type: String, default: null }
}, { _id: false });




const MasterRegistrySchema = new mongoose.Schema({
    emailAddress: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return GOV_EMAIL_REGEX.test(v);
            },
            message: props => `${props.value} is not a valid official email. Must end with @assam.gov.in`
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['Active', 'Inactive', 'Role-based']
    },
    officeName: { type: String, required: true },
    creationDate: { type: Date, default: Date.now },

    // Which basis this account was provisioned under — informs whether it
    // is tied to a person (Name-based) or persists across incumbents
    // (Designation/Office-based), per DITEC SOP Form EM-01/EM-03.
    accountBasis: {
        type: String,
        enum: ['NAME_BASED', 'DESIGNATION_BASED', 'OFFICE_BASED'],
        default: 'NAME_BASED'
    },

    // Track if this record was migrated from legacy systems
    isLegacyImport: {
        type: Boolean,
        default: false
    },

    // Populated when an approved Deletion/Surrender request retires this
    // account. Kept as a soft-delete flag (status flips to 'Inactive')
    // rather than a hard delete, since the SOP explicitly warns deleted
    // accounts cannot be restored — we still want an audit trail.
    deactivation: {
        isDeactivated: { type: Boolean, default: false },
        reason: { type: String, default: null },
        deactivatedAt: { type: Date, default: null },
        requestId: { type: String, default: null } // originating RequestForm.requestId
    },

    // Set only for time-bound accounts (contract/consultancy), extended via
    // Form EM-04 "Account Validity Extension".
    validUntil: { type: Date, default: null },

    currentCustodian: {
        name: { type: String, required: true },
        designation: { type: String, required: true },
        mobile: { type: String, required: true },
        dob: { type: Date, required: true },
        retirementDate: { type: Date, required: true }
    },
    custodianHistory: [CustodianHistorySchema]
}, {
    timestamps: true
});

MasterRegistrySchema.index({ officeName: 1, status: 1 });

const MasterRegistry = mongoose.model('MasterRegistry', MasterRegistrySchema);

// Exposed as a static property so any other layer (services/controllers)
// validating a government email address reuses the exact same rule instead
// of re-declaring the regex and risking drift.
MasterRegistry.GOV_EMAIL_REGEX = GOV_EMAIL_REGEX;

module.exports = MasterRegistry;
//Done by Tinku Moni Kaushik , in 15th July , 2026