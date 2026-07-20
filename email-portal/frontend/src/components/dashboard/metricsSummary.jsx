import { Card } from '../ui/primitives';
import styles from './metricsSummary.module.css';

function MetricCard({ value, label }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricValue}>{value}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}

/**
 * Renders whatever services/dashboardService.js returns — same shape for
 * both getGlobalMetrics (portal_manager) and getScopedMetrics
 * (office_admin), so this one component serves both dashboards.
 */
export default function MetricsSummary({ metrics, scope, officeName }) {
  if (!metrics) return null;
  const { registryBreakdown, requestWorkflowBreakdown, pendingByFormType, turnaroundTimeMetrics } = metrics;

  return (
    <>
      <div className={styles.grid}>
        <MetricCard value={registryBreakdown.Active} label="Active Accounts" />
        <MetricCard value={registryBreakdown.Inactive} label="Inactive Accounts" />
        <MetricCard value={registryBreakdown['Role-based'] || 0} label="Role-based Accounts" />
        <MetricCard value={requestWorkflowBreakdown.Pending} label="Pending Requests" />
        <MetricCard value={requestWorkflowBreakdown.Reverted} label="Reverted (Action Needed)" />
        <MetricCard value={`${turnaroundTimeMetrics.averageDaysToApprove}d`} label="Avg. Turnaround" />
      </div>

      <Card title={scope === 'Global' ? 'Global request workflow' : `Request workflow — ${officeName || ''}`}>
        <div className={styles.breakdownRow}>
          {Object.entries(requestWorkflowBreakdown).map(([status, count]) => (
            <MetricCard key={status} value={count} label={status} />
          ))}
        </div>
      </Card>

      <Card title="Pending by form type">
        <div className={styles.breakdownRow}>
          {Object.entries(pendingByFormType).map(([type, count]) => (
            <MetricCard key={type} value={count} label={type.replace('_', ' ')} />
          ))}
        </div>
      </Card>
    </>
  );
}
