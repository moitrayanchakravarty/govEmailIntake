import { useState } from 'react';
import Dialog from '../ui/dialog';
import { Button, Alert, Badge } from '../ui/primitives';
import { STATUS_META } from '../../lib/constants';
import RequestDetailFields from './requestDetailFields';
import ReviewHistoryTimeline from './reviewHistoryTimeline';

/**
 * One dialog, three audiences:
 *  - portal_manager on a Pending request  -> Approve / Reject / Revert
 *  - user on their own Draft                -> Continue Editing / Delete
 *  - user on their own Reverted             -> Resubmit
 * Anything else (Approved/Rejected, or a Pending request viewed by its
 * own applicant/user) is read-only.
 */
export default function RequestDetailDialog({
  request, role, onClose, onReview, onEditDraft, onDeleteDraft, onResubmit, busy
}) {
  const [comments, setComments] = useState('');
  const [commentsError, setCommentsError] = useState('');

  if (!request) return null;

  const isPortalManager = role === 'portal_manager';
  const canReview = isPortalManager && request.status === 'Pending';
  const isOwnerAdmin = role === 'user';

  const handleReview = (action) => {
    if (action === 'REVERT' && !comments.trim()) {
      setCommentsError('Comments are required when reverting a request.');
      return;
    }
    setCommentsError('');
    onReview(request._id, action, comments);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={
        <span>
          {request.requestId || 'Draft request'}{' '}
          <Badge variant={STATUS_META[request.status]?.variant || 'neutral'}>{STATUS_META[request.status]?.label || request.status}</Badge>
        </span>
      }
      footer={
        <>
          {request.status === 'Draft' && isOwnerAdmin && (
            <>
              <Button variant="danger" onClick={() => onDeleteDraft(request._id)} loading={busy === 'delete'}>Delete Draft</Button>
              <Button variant="primary" onClick={() => onEditDraft(request)}>Continue Editing</Button>
            </>
          )}
          {request.status === 'Reverted' && isOwnerAdmin && (
            <Button variant="primary" onClick={() => onResubmit(request)}>Resubmit</Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </>
      }
    >
      {request.status === 'Reverted' && request.latestComments && (
        <Alert variant="warning" title="Reviewer comments">{request.latestComments}</Alert>
      )}

      <RequestDetailFields request={request} />

      <h3 style={{ fontWeight: 700, marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>History</h3>
      <ReviewHistoryTimeline history={request.reviewHistory} />

      {canReview && (
        <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-2)' }}>Review decision</h3>
          <label htmlFor="review-comments" style={{ fontWeight: 600, display: 'block', marginBottom: 'var(--space-1)' }}>
            Comments <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(required for Revert)</span>
          </label>
          <textarea
            id="review-comments"
            rows={3}
            value={comments}
            onChange={(e) => { setComments(e.target.value); setCommentsError(''); }}
            style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-2)' }}
          />
          {commentsError && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)' }}>{commentsError}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button variant="primary" loading={busy === 'APPROVE'} onClick={() => handleReview('APPROVE')}>Approve</Button>
            <Button variant="danger" loading={busy === 'REJECT'} onClick={() => handleReview('REJECT')}>Reject</Button>
            <Button variant="accent" loading={busy === 'REVERT'} onClick={() => handleReview('REVERT')}>Revert with Comments</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
