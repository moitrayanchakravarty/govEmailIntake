const MasterRegistry = require('../models/MasterRegistry');



/**
 * @desc    Search and filter the Master Email Registry
 * @route   GET /api/registry/search
 * @access  Private (Office Admin & Portal Manager)
 */




exports.searchRegistry = async (req, res) => {

    try {


        // 1. Initialize an empty query engine
        let dbQuery = {};




        // 2. HARDRULE (REG-04): Enforce data scoping based on user authorization
        // req.user will be populated by  authentication middleware[cite: 4]
        if (req.user.role?.toLowerCase() === 'office_admin') {
            dbQuery.officeName = req.user.officeName; // Can ONLY see their own office entries
        }
        // If user is Portal_Manager, we skip this restriction to let them see all offices[cite: 2]







        // 3. Add optional dynamic filters (REG-02)[cite: 2]
        if (req.query.status) {
            dbQuery.status = req.query.status;
        }
        if (req.query.designation) {
            // Case-insensitive regex partial match (e.g., searching "Director" catches "Director of IT")[cite: 2]
            dbQuery['currentCustodian.designation'] = { $regex: req.query.designation, $options: 'i' };
        }







        // 4. Query the database
        const records = await MasterRegistry.find(dbQuery);






        // 5. Return structured response
        res.status(200).json({
            success: true,
            count: records.length,
            data: records
        });
    }






    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching registry details.',
            error: error.message
        });
    }
};









/**
 * @desc    System utility to safely update or create registry items strictly upon PM Approval (REG-03)
 * @param   {String} emailAddress - The target email string
 * @param   {Object} updateData - Clean payload matching the MasterRegistry schema
 */
exports.updateRegistryOnApproval = async (emailAddress, updateData) => {

    try {
        return await MasterRegistry.findOneAndUpdate(
            { emailAddress: emailAddress.toLowerCase().trim() },
            { $set: updateData },
            { new: true, upsert: true } // Upsert creates a new entry if it doesn't exist yet[cite: 2]
        );
    }


    catch (error) {
        console.error(`Registry Update Failure for ${emailAddress}:`, error.message);
        throw error;
    }
};




//Done by Tinku Moni Kaushik , in 15th July , 2026