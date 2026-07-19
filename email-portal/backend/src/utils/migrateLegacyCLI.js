const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const { runLegacyMigration } = require('../services/migrationService');
const env = require('../config/env');
const MONGO_URI = env.MONGO_URI;



const EXCEL_FILE_PATH = 'C:/Users/hp/Desktop/data1.xlsx'; // Expecting .xlsx format now





async function bootstrapExcelMigration() {
    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        console.error(`❌ Error: Source Excel file was not found at: ${EXCEL_FILE_PATH}`);
        process.exit(1);
    }

    try {

        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Database connected successfully.");




        console.log("Loading workbook sheets...");
        // Read the physical Excel file
        const workbook = xlsx.readFile(EXCEL_FILE_PATH);





        // Target the very first worksheet tab in the file
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];





        // Convert Worksheet cells cleanly to JSON Row Objects
        const legacyRows = xlsx.utils.sheet_to_json(worksheet);





        console.log(`Parsed ${legacyRows.length} total rows from sheet tab: "${sheetName}"`);




        // Run the migration pipeline with validations (MIGRATE-01, MIGRATE-02)
        console.log("Executing migration validations...");
        const migrationResult = await runLegacyMigration(legacyRows);





        console.log(`\n============== MIGRATION REPORT ==============`);
        if (migrationResult.success) {
            console.log(`✅ SUCCESS: ${migrationResult.message}`);
        } else {
            console.log(`❌ MIGRATION REJECTED: Process aborted.`);
            console.log(`Reason: ${migrationResult.message}`);
        }
        console.log(`==============================================\n`);





        await mongoose.disconnect();
        process.exit(migrationResult.success ? 0 : 1);





    } catch (error) {
        console.error("Critical execution breakdown:", error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}




bootstrapExcelMigration();
