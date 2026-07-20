import { useState } from 'react';
import { authClient } from '../../api/authClient';
import LogoutButton from '../../components/logoutButton';
import { Tabs, Card, Spinner, Alert, Button } from '../../components/ui/primitives';
import MetricsSummary from '../../components/dashboard/metricsSummary';
import NewRequestLauncher from '../../components/forms/newRequestLauncher';
import RequestFormRouter from '../../components/forms/requestFormRouter';
import RequestsTable from '../../components/review/requestsTable';
import RequestDetailDialog from '../../components/review/requestDetailDialog';
import useDashboardMetrics from '../../hooks/api/useDashboardMetrics';
import useRequestsList from '../../hooks/api/useRequestsList';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage } from '../../lib/utils';
import { FORM_TYPE_META } from '../../lib/constants';
import styles from './officeAdminDashboard.module.css';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'new-request', label: 'New Request' },
  { value: 'my-requests', label: 'My Requests' }
];

export default function OfficeAdminDashboard() {
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState('overview');

  const { metrics, scope, loading: metricsLoading, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: requests, loading: listLoading, error: listError, filters, setFilters, refetch: refetchList } = useRequestsList();

  const [formSession, setFormSession] = useState(null); // { formType, mode, request } | null
  const [viewingRequest, setViewingRequest] = useState(null);
  const [dialogBusy, setDialogBusy] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleSelectNewForm = (formType) => setFormSession({ formType, mode: 'create', request: null });

  const handleFormDone = () => {
    setFormSession(null);
    setActiveTab('my-requests');
    refetchList();
    refetchMetrics();
  };

  const handleView = (request) => {
    setActionError('');
    setViewingRequest(request);
  };

  const handleEditDraft = (request) => {
    setViewingRequest(null);
    setFormSession({ formType: request.formType, mode: 'edit-draft', request });
  };

  const handleResubmit = (request) => {
    setViewingRequest(null);
    setFormSession({ formType: request.formType, mode: 'resubmit', request });
  };

  const handleDeleteDraft = async (id) => {
    setDialogBusy('delete');
    try {
      await requestsApi.deleteDraft(id);
      setViewingRequest(null);
      refetchList();
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete draft.'));
    } finally {
      setDialogBusy(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Office Admin Dashboard</h1>
          <p className={styles.subtitle}>
            {session?.user?.name} · {session?.user?.officeName}
          </p>
        </div>
        <LogoutButton />
      </div>

      {formSession ? (
        <Card
          title={`${FORM_TYPE_META[formSession.formType].code} — ${FORM_TYPE_META[formSession.formType].label}`}
          actions={<Button variant="ghost" onClick={() => setFormSession(null)}>Back</Button>}
        >
          <RequestFormRouter
            formType={formSession.formType}
            mode={formSession.mode}
            request={formSession.request}
            onDone={handleFormDone}
            onCancel={() => setFormSession(null)}
          />
        </Card>
      ) : (
        <>
          <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            metricsLoading ? <Spinner label="Loading metrics…" /> : <MetricsSummary metrics={metrics} scope={scope} officeName={session?.user?.officeName} />
          )}

          {activeTab === 'new-request' && (
            <Card title="Start a new request">
              <NewRequestLauncher onSelect={handleSelectNewForm} />
            </Card>
          )}

          {activeTab === 'my-requests' && (
            <Card
              title="My Requests"
              actions={(
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}
                  style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                >
                  <option value="">All statuses</option>
                  {['Draft', 'Pending', 'Approved', 'Rejected', 'Reverted'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            >
              {actionError && <Alert variant="danger">{actionError}</Alert>}
              {listError && <Alert variant="danger">{listError}</Alert>}
              {listLoading ? <Spinner label="Loading requests…" /> : <RequestsTable requests={requests} onView={handleView} />}
            </Card>
          )}
        </>
      )}

      {viewingRequest && (
        <RequestDetailDialog
          request={viewingRequest}
          role="office_admin"
          busy={dialogBusy}
          onClose={() => setViewingRequest(null)}
          onEditDraft={handleEditDraft}
          onDeleteDraft={handleDeleteDraft}
          onResubmit={handleResubmit}
        />
      )}
    </div>
  );
}
