import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bulkMetaSchema } from '../../lib/validation/schemas';
import { ACCOUNT_BASIS_OPTIONS, MAX_BULK_ROWS } from '../../lib/constants';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage } from '../../lib/utils';
import ToggleGroup from '../ui/toggleGroup';
import { TextField, TextAreaField } from '../ui/formControls';
import { Button, Alert } from '../ui/primitives';
import BulkReviewTable from './bulkReviewTable';
import styles from './formShell.module.css';

function defaultsFromRequest(request) {
  if (!request) {
    return {
      accountBasis: '',
      nodalOfficer: { name: '', designation: '', departmentOffice: '', officialEmail: '', mobile: '', projectPurpose: '' }
    };
  }
  return {
    accountBasis: request.accountBasis || '',
    nodalOfficer: request.nodalOfficer || { name: '', designation: '', departmentOffice: '', officialEmail: '', mobile: '', projectPurpose: '' }
  };
}

/**
 * Form EM-02 — Bulk Account Creation. Office admins download the standard
 * CSV template (matching services/requestService.js's CSV_COLUMNS
 * exactly), fill it offline, then upload it here for real-time validation
 * (POST /api/requests/bulk/validate) before anything is persisted.
 */
export default function BulkCreationForm({ mode = 'create', request, onDone, onCancel }) {
  const [rows, setRows] = useState(request?.bulkApplicants || []);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(null); // 'downloading' | 'uploading' | 'draft' | 'submit'
  const fileInputRef = useRef(null);

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(bulkMetaSchema),
    defaultValues: defaultsFromRequest(request)
  });

  const invalidRowCount = rows.filter((r) => r.rowValidation && r.rowValidation.isValid === false).length;

  const handleDownloadTemplate = async () => {
    setBusy('downloading');
    try {
      const blob = await requestsApi.downloadBulkTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-email-request-template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setUploadError('Could not download the template. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setBusy('uploading');
    try {
      const res = await requestsApi.validateBulkCsv(file);
      setRows(res.data);
      setUploadSummary({ total: res.totalRows, valid: res.validRows, invalid: res.invalidRows });
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Could not validate the uploaded file.'));
      setRows([]);
      setUploadSummary(null);
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const buildPayload = (values, saveAsDraft) => ({
    accountBasis: values.accountBasis,
    nodalOfficer: values.nodalOfficer,
    rows,
    saveAsDraft
  });

  const handleSaveDraft = async () => {
    setSubmitError('');
    if (!rows.length) {
      setSubmitError('Upload a validated CSV file before saving a draft.');
      return;
    }
    setBusy('draft');
    try {
      const values = getValues();
      const payload = buildPayload(values, true);
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, payload);
      } else {
        await requestsApi.createBulk(payload);
      }
      onDone?.('draft-saved');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Could not save draft.'));
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = async (values) => {
    setSubmitError('');
    if (!rows.length) {
      setSubmitError('Upload a validated CSV file before submitting.');
      return;
    }
    if (invalidRowCount > 0) {
      setSubmitError(`${invalidRowCount} row(s) still contain validation errors. Fix your CSV and re-upload before submitting.`);
      return;
    }
    setBusy('submit');
    try {
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, buildPayload(values, false));
        await requestsApi.submitDraft(request._id);
      } else if (mode === 'resubmit') {
        await requestsApi.resubmit(request._id, buildPayload(values, false));
      } else {
        await requestsApi.createBulk(buildPayload(values, false));
      }
      onDone?.('submitted');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Submission failed.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <form className={styles.shell} onSubmit={handleSubmit(onSubmit)} noValidate>
      {mode === 'resubmit' && request?.latestComments && (
        <Alert variant="warning" title="Reviewer comments">
          {request.latestComments}
        </Alert>
      )}
      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Account basis</h3>
        <ToggleGroup
          legend="These accounts will be created on the basis of"
          options={ACCOUNT_BASIS_OPTIONS}
          registration={register('accountBasis')}
          error={errors.accountBasis?.message}
          required
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Nodal Officer (custodian responsible for this bulk request)</h3>
        <div className={styles.grid2}>
          <TextField id="nodalName" label="Name" required registration={register('nodalOfficer.name')} error={errors.nodalOfficer?.name?.message} />
          <TextField id="nodalDesignation" label="Designation" required registration={register('nodalOfficer.designation')} error={errors.nodalOfficer?.designation?.message} />
        </div>
        <TextField id="nodalDept" label="Department/Office" required registration={register('nodalOfficer.departmentOffice')} error={errors.nodalOfficer?.departmentOffice?.message} />
        <div className={styles.grid2}>
          <TextField id="nodalEmail" label="Official Email" type="email" required registration={register('nodalOfficer.officialEmail')} error={errors.nodalOfficer?.officialEmail?.message} />
          <TextField id="nodalMobile" label="Mobile Number" required registration={register('nodalOfficer.mobile')} error={errors.nodalOfficer?.mobile?.message} />
        </div>
        <TextAreaField id="nodalPurpose" label="Purpose/Justification for this bulk request" required registration={register('nodalOfficer.projectPurpose')} error={errors.nodalOfficer?.projectPurpose?.message} />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Applicant list</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
          Download the standard template, fill in one row per account (max {MAX_BULK_ROWS}), then upload it below.
        </p>
        <div className={styles.actions} style={{ marginTop: 0, marginBottom: 'var(--space-4)' }}>
          <Button type="button" variant="secondary" loading={busy === 'downloading'} onClick={handleDownloadTemplate}>
            Download CSV Template
          </Button>
          <Button type="button" variant="primary" loading={busy === 'uploading'} onClick={() => fileInputRef.current?.click()}>
            Upload Completed CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />
        </div>

        {uploadError && <Alert variant="danger">{uploadError}</Alert>}
        {uploadSummary && (
          <Alert variant={uploadSummary.invalid ? 'warning' : 'success'}>
            {uploadSummary.total} row(s) read — {uploadSummary.valid} valid, {uploadSummary.invalid} with errors.
          </Alert>
        )}

        <BulkReviewTable rows={rows} />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" loading={busy === 'draft'} onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button type="submit" variant="primary" loading={busy === 'submit'}>
          {mode === 'resubmit' ? 'Resubmit Request' : 'Submit for Review'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
