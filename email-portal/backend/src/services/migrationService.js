const MasterRegistry = require('../models/MasterRegistry');
const mongoose = require('mongoose');





// Regular Expression matching our schema validator
const GOV_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@assam\.gov\.in$/;





exports.runLegacyMigration = async (legacyDataBatch) => {
    const processedBatch = legacyDataBatch.map((record) => {
        const keys = Object.keys(record);
        if (keys.length === 1 && keys[0].includes(',')) {
            const compoundKey = keys[0];
            const compoundValue = record[compoundKey];
            if (typeof compoundValue === 'string') {
                const headerFields = compoundKey.split(',').map(s => s.trim());
                const valueFields = compoundValue.split(',').map(s => s.trim());
                
                const newRecord = {};
                headerFields.forEach((field, idx) => {
                    newRecord[field] = valueFields[idx] || '';
                });
                return newRecord;
            }
        }
        return record;
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        console.log(`Analyzing ${processedBatch.length} legacy Excel rows...`);
        const uniqueEmailsInBatch = new Set();

        for (let i = 0; i < processedBatch.length; i++) {
            const record = processedBatch[i];
            const email = record.emailAddress?.toLowerCase().trim();

            if (!email) {
                throw new Error(`Row ${i + 2}: Email address cell is empty.`); // i + 2 matches row numbering in Excel (accounting for Header in Row 1)
            }

            // Syntax Validation check
            if (!GOV_EMAIL_REGEX.test(email)) {
                throw new Error(`Row ${i + 2}: Invalid domain structure. Email '${email}' must end with @assam.gov.in`);
            }

            // Internal File Duplication Check
            if (uniqueEmailsInBatch.has(email)) {
                throw new Error(`Row ${i + 2}: Duplicate email detected within the upload sheet itself (${email})`);
            }
            uniqueEmailsInBatch.add(email);

            // Active Registry Collision Check
            const existingRecord = await MasterRegistry.findOne({ emailAddress: email }).session(session);
            if (existingRecord) {
                throw new Error(`Row ${i + 2}: Conflict. Email '${email}' already exists in live database.`);
            }
        }

        // Format fields with legacy tracking flag attached
        const formattedRecords = processedBatch.map(record => ({
            emailAddress: record.emailAddress.toLowerCase().trim(),
            status: record.status || 'Active',
            officeName: record.officeName,
            isLegacyImport: true, // Mark this batch row strictly as a legacy ingest!
            currentCustodian: {
                name: record.custodianName,
                designation: record.designation,
                mobile: record.mobile?.toString(),
                dob: new Date(record.dob),
                retirementDate: new Date(record.retirementDate)
            },
            custodianHistory: record.history || []
        }));





        // Atomically execute safe writes
        const insertedData = await MasterRegistry.insertMany(formattedRecords, { session });

        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            message: `Successfully migrated ${insertedData.length} active legacy accounts.`,
            count: insertedData.length
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return {
            success: false,
            message: error.message
        };
    }
};