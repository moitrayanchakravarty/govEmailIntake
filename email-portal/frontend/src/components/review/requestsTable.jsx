import DataTable from '../ui/dataTable';
import { Badge, Button } from '../ui/primitives';
import { FORM_TYPE_META, STATUS_META } from '../../lib/constants';
import { formatDateTime } from '../../lib/utils';

/**
 * showOffice/showSubmitter: portal_manager's Review Queue needs to see
 * which office and which user a request came from; a user's own
 * "My Requests" list doesn't (they already know it's theirs — the backend
 * only ever returns their own submissions to them anyway).
 */
export default function RequestsTable({ requests, onView, showOffice = false, showSubmitter = false }) {
  const columns = [
    { key: 'requestId', header: 'Request ID', render: (r) => r.requestId || <em>Draft</em> },
    { key: 'formType', header: 'Form', render: (r) => FORM_TYPE_META[r.formType]?.label || r.formType },
    ...(showOffice ? [{ key: 'officeName', header: 'Office' }] : []),
    ...(showSubmitter ? [{ key: 'submittedBy', header: 'Submitted By', render: (r) => r.submittedBy?.name }] : []),
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge variant={STATUS_META[r.status]?.variant || 'neutral'}>{STATUS_META[r.status]?.label || r.status}</Badge>
    },
    { key: 'lastActionAt', header: 'Last Action', render: (r) => formatDateTime(r.lastActionAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => <Button size="sm" variant="secondary" onClick={() => onView(r)}>View</Button>
    }
  ];

  return (
    <DataTable
      columns={columns}
      rows={requests}
      rowKey={(r) => r._id}
      emptyMessage="No requests found."
      caption="Email request submissions"
    />
  );
}
