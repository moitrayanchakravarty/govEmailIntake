import DataTable from '../ui/dataTable';
import { Badge } from '../ui/primitives';
import { formatDate } from '../../lib/utils';

export default function BulkReviewTable({ rows }) {
  const columns = [
    { key: 'rowNumber', header: 'Row' },
    { key: 'fullName', header: 'Full Name' },
    { key: 'designation', header: 'Designation' },
    { key: 'departmentOffice', header: 'Department/Office' },
    { key: 'dob', header: 'DOB', render: (r) => formatDate(r.dob) },
    { key: 'preferredEmailId', header: 'Preferred Email' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (r.rowValidation?.isValid
        ? <Badge variant="success">Valid</Badge>
        : <Badge variant="danger">{r.rowValidation?.errors?.length || 0} issue(s)</Badge>)
    },
    {
      key: 'errors',
      header: 'Details',
      render: (r) => (r.rowValidation?.errors?.length
        ? (
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            {r.rowValidation.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )
        : '—')
    }
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.rowNumber}
      emptyMessage="Upload a completed CSV template to see applicants here."
      caption="Bulk applicant validation results"
    />
  );
}
