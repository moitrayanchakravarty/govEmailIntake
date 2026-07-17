const mongoose = require('mongoose');

// Regular Expression to enforce official Assam Government email domain validation
const GOV_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@assam\.gov\.in$/;




const CustodianHistorySchema = new mongoose.Schema({
    holderName: { type: String, required: true },
    designation: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: mongoose.Schema.Types.Mixed, default: "ongoing" }
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




    // Track if this record was migrated from legacy systems
    isLegacyImport: {
        type: Boolean,
        default: false
    },




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

module.exports = mongoose.model('MasterRegistry', MasterRegistrySchema);
//Done by Tinku Moni Kaushik , in 15th July , 2026