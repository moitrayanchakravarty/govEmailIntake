import { useState } from 'react';
import { authClient } from '../../api/authClient';
import LogoutButton from '../../components/logoutButton';
import { Tabs, Card, Spinner, Alert } from '../../components/ui/primitives';
import MetricsSummary from '../../components/dashboard/metricsSummary';
import RequestsTable from '../../components/review/requestsTable';
import RequestDetailDialog from '../../components/review/requestDetailDialog';
import useDashboardMetrics from '../../hooks/api/useDashboardMetrics';
import useRequestsList from '../../hooks/api/useRequestsList';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage } from '../../lib/utils';
import styles from '../officeAdmin/officeAdminDashboard.module.css';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'review-queue', label: 'Review Queue' },
  { value: 'all-requests', label: 'All Requests' }
];

export default function PortalManagerDashboard() {
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState('overview');

  const { metrics, scope, loading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();

  const reviewQueue = useRequestsList({ status: 'Pending' });
  const allRequests = useRequestsList({});
  const list = activeTab === 'review-queue' ? reviewQueue : allRequests;

  const [viewingRequest, setViewingRequest] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleView = (request) => {
    setActionError('');
    setViewingRequest(request);
  };

  const handleReview = async (id, action, comments) => {
    setReviewBusy(action);
    try {
      await requestsApi.review(id, { action, comments });
      setViewingRequest(null);
      reviewQueue.refetch();
      allRequests.refetch();
      refetchMetrics();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not record review decision.'));
    } finally {
      setReviewBusy(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Portal Manager Dashboard</h1>
          <p className={styles.subtitle}>{session?.user?.name}</p>
        </div>
        <LogoutButton />
      </div>

      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        metricsLoading ? <Spinner label="Loading metrics…" /> : <MetricsSummary metrics={metrics} scope={scope} />
      )}

      {(activeTab === 'review-queue' || activeTab === 'all-requests') && (
        <Card title={activeTab === 'review-queue' ? 'Pending Requests Awaiting Review' : 'All Requests'}>
          {actionError && <Alert variant="danger">{actionError}</Alert>}
          {list.error && <Alert variant="danger">{list.error}</Alert>}
          {list.loading
            ? <Spinner label="Loading requests…" />
            : <RequestsTable requests={list.data} onView={handleView} showOffice showSubmitter />}
        </Card>
      )}

      {viewingRequest && (
        <RequestDetailDialog
          request={viewingRequest}
          role="portal_manager"
          busy={reviewBusy}
          onClose={() => setViewingRequest(null)}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
