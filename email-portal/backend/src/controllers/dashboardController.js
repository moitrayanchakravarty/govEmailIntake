const dashboardService = require('../services/dashboardService');

/**
 * @desc    Fetch metric summaries honoring administrative data rules (RPT-01, RPT-02)
 * @route   GET /api/dashboard/metrics
 */





exports.getDashboardMetrics = async (req, res) => {
    try {
        const userRole = req.user.role;




        // RPT-01: Portal Manager / Super Admin Global Metrics Access
        if (userRole === 'Portal_Manager' || userRole === 'Super_Admin') {
            const metrics = await dashboardService.getGlobalMetrics();
            return res.status(200).json({ success: true, scope: "Global", data: metrics });
        }




        // RPT-02: Office Admin Scoped Metrics Access
        if (userRole === 'Office_Admin') {
            if (!req.user.officeName) {
                return res.status(400).json({ success: false, message: "Administrative profile error: Office assignment missing." });
            }
            const metrics = await dashboardService.getScopedMetrics(req.user.officeName);
            return res.status(200).json({ success: true, scope: "Departmental", data: metrics });
        }





        return res.status(403).json({ success: false, message: "Access Denied: Unauthorized administrative role profile." });

    }


    //errorr
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};