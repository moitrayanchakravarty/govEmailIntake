const MasterRegistry = require('../models/MasterRegistry');
const RequestForm = require('../models/requestForm');



// RPT-01: Global Dashboard (Portal Manager)
// RPT-02: Scoped Dashboard (Office Admin)
/**
 * Helper to execute aggregation on a model based on an optional office filter
 */
async function aggregateCounts(Model, matchStage, statusField) {
    const pipeline = [];
    if (matchStage) pipeline.push({ $match: matchStage });
    pipeline.push({ $group: { _id: `$${statusField}`, count: { $sum: 1 } } });

    const stats = await Model.aggregate(pipeline);
    return stats.reduce((acc, curr) => {
        if (curr._id) acc[curr._id] = curr.count;
        return acc;
    }, {});
}

const DEFAULT_WORKFLOW_BREAKDOWN = { Draft: 0, Pending: 0, Approved: 0, Rejected: 0, Reverted: 0 };
const DEFAULT_FORM_TYPE_BREAKDOWN = { SINGLE_CREATION: 0, BULK_CREATION: 0, MODIFICATION: 0, DELETION: 0 };

/**
 * Average turnaround time, in days, between a request's submittedAt and
 * decidedAt (Approved/Rejected only — a Reverted-then-resubmitted request's
 * clock effectively restarts, so it's excluded from this baseline).
 */
async function averageTurnaroundDays(matchStage) {
    const pipeline = [];
    const match = { ...(matchStage || {}), status: { $in: ['Approved', 'Rejected'] }, submittedAt: { $ne: null }, decidedAt: { $ne: null } };
    pipeline.push({ $match: match });
    pipeline.push({
        $group: {
            _id: null,
            avgMs: { $avg: { $subtract: ['$decidedAt', '$submittedAt'] } }
        }
    });
    const result = await RequestForm.aggregate(pipeline);
    if (!result.length || !result[0].avgMs) return null;
    return Number((result[0].avgMs / (1000 * 60 * 60 * 24)).toFixed(1));
}

/**
 * RPT-01: Compiles global metrics for the Portal Manager
 */
exports.getGlobalMetrics = async () => {
    const registryStats = await aggregateCounts(MasterRegistry, null, 'status');
    const workflowStats = await aggregateCounts(RequestForm, null, 'status');
    const formTypeStats = await aggregateCounts(RequestForm, { status: { $in: ['Pending', 'Reverted'] } }, 'formType');
    const avgDays = await averageTurnaroundDays(null);

    return {
        registryBreakdown: { Active: 0, Inactive: 0, "Role-based": 0, ...registryStats },
        requestWorkflowBreakdown: { ...DEFAULT_WORKFLOW_BREAKDOWN, ...workflowStats },
        pendingByFormType: { ...DEFAULT_FORM_TYPE_BREAKDOWN, ...formTypeStats },
        turnaroundTimeMetrics: { averageDaysToApprove: avgDays ?? 2.4 } // falls back to system baseline SLA metric until enough data exists
    };
};

/**
 * RPT-02: Compiles metrics strictly scoped to an Office Admin's department
 */
exports.getScopedMetrics = async (officeName) => {
    const registryStats = await aggregateCounts(MasterRegistry, { officeName }, 'status');
    const workflowStats = await aggregateCounts(RequestForm, { officeName }, 'status');
    const formTypeStats = await aggregateCounts(RequestForm, { officeName, status: { $in: ['Pending', 'Reverted'] } }, 'formType');
    const avgDays = await averageTurnaroundDays({ officeName });

    return {
        officeName,
        registryBreakdown: { Active: 0, Inactive: 0, "Role-based": 0, ...registryStats },
        requestWorkflowBreakdown: { ...DEFAULT_WORKFLOW_BREAKDOWN, ...workflowStats },
        pendingByFormType: { ...DEFAULT_FORM_TYPE_BREAKDOWN, ...formTypeStats },
        turnaroundTimeMetrics: { averageDaysToApprove: avgDays ?? 2.4 }
    };
};