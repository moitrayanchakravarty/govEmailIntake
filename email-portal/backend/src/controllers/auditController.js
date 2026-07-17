const { MongoClient } = require('mongodb');
const env = require('../config/env');
const client = require('../config/mongoClient');

/**
 * @desc    View the login audit trail (success + failure attempts)
 * @route   GET /api/admin/login-logs
 * @access  Private (portal_manager only)
 */
exports.getLoginLogs = async (req, res) => {
    try {
        const db = client.db();
        const logs = await db.collection('loginAuditLog')
            .find({})
            .sort({ timestamp: -1 }) // most recent first
            .limit(200) // avoid accidentally pulling the entire collection
            .toArray();

        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch login logs.', error: error.message });
    }
};