import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { deletionSchema } from '../../lib/validation/schemas';
import { DELETION_REASON_OPTIONS } from '../../lib/constants';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage, fieldError } from '../../lib/utils';
import useOfficeRegistry from '../../hooks/api/useOfficeRegistry';
import ToggleGroup from '../ui/toggleGroup';
import { TextField, TextAreaField, SelectField } from '../ui/formControls';
import { Button, Alert, Spinner } from '../ui/primitives';
import styles from './formShell.module.css';

function defaultsFromRequest(request) {
  if (!request) {
    return {
      deletion: {
        existingEmailAddress: '', accountHolderName: '', designation: '', departmentOffice: '',
        dob: '', retirementOrExpiryDate: '', mobile: '', reason: '',
        orderReference: '', primaryAccountToRetain: '', otherSpecify: ''
      }
    };
  }
  const d = request.deletion || {};
  return {
    deletion: {
      existingEmailAddress: d.existingEmailAddress || '',
      accountHolderName: d.accountHolderName || '',
      designation: d.designation || '',
      departmentOffice: d.departmentOffice || '',
      dob: d.dob || '',
      retirementOrExpiryDate: d.retirementOrExpiryDate || '',
      mobile: d.mobile || '',
      reason: d.reason || '',
      orderReference: d.orderReference || '',
      primaryAccountToRetain: d.primaryAccountToRetain || '',
      otherSpecify: d.otherSpecify || ''
    }
  };
}

/**
 * Form EM-05 — Deletion / Surrender. Reason options mirror the SOP's
 * checkbox list exactly, but only one reason applies to any single
 * deletion so it's modeled (and toggled) as a single-select — see
 * ToggleGroup's own comment for the same note.
 */
export default function DeletionForm({ mode = 'create', request, onDone, onCancel }) {
  const { records, loading: registryLoading } = useOfficeRegistry();
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(deletionSchema),
    defaultValues: defaultsFromRequest(request)
  });

  const reason = watch('deletion.reason');
  const selectedEmail = watch('deletion.existingEmailAddress');

  const emailOptions = records.map((r) => ({
    value: r.emailAddress,
    label: `${r.emailAddress} — ${r.currentCustodian?.name || ''} (${r.officeName})`
  }));

  const handleEmailSelect = (e) => {
    register('deletion.existingEmailAddress').onChange(e);
    const record = records.find((r) => r.emailAddress === e.target.value);
    if (record) {
      setValue('deletion.accountHolderName', record.currentCustodian?.name || '');
      setValue('deletion.designation', record.currentCustodian?.designation || '');
      setValue('deletion.departmentOffice', record.officeName || '');
    }
  };

  const handleSaveDraft = async () => {
    setSubmitError('');
    setBusy('draft');
    try {
      const values = getValues();
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, values);
      } else {
        await requestsApi.createDeletion({ ...values, saveAsDraft: true });
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
    setBusy('submit');
    try {
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, values);
        await requestsApi.submitDraft(request._id);
      } else if (mode === 'resubmit') {
        await requestsApi.resubmit(request._id, values);
      } else {
        await requestsApi.createDeletion({ ...values, saveAsDraft: false });
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
      <Alert variant="info">Deletion cannot be undone once approved. The account will be permanently deactivated.</Alert>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Account to be deleted / surrendered</h3>
        {registryLoading ? (
          <Spinner label="Loading your office's accounts…" />
        ) : (
          <SelectField
            id="existingEmailAddress"
            label="Existing Email Address"
            required
            options={emailOptions}
            registration={{ ...register('deletion.existingEmailAddress'), onChange: handleEmailSelect }}
            error={fieldError(errors, 'deletion.existingEmailAddress')}
          />
        )}

        <TextField id="accountHolderName" label="Account Holder Name" required registration={register('deletion.accountHolderName')} error={fieldError(errors, 'deletion.accountHolderName')} />
        <div className={styles.grid2}>
          <TextField id="designation" label="Designation" registration={register('deletion.designation')} error={fieldError(errors, 'deletion.designation')} />
          <TextField id="departmentOffice" label="Department/Office" registration={register('deletion.departmentOffice')} error={fieldError(errors, 'deletion.departmentOffice')} />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reason for deletion / surrender</h3>
        <ToggleGroup
          legend="Select one reason"
          options={DELETION_REASON_OPTIONS}
          registration={register('deletion.reason')}
          error={fieldError(errors, 'deletion.reason')}
          required
        />

        {reason === 'DISCIPLINARY_ACTION' && (
          <TextField id="orderReference" label="Order Reference" required hint="Attach/cite the disciplinary or administrative order." registration={register('deletion.orderReference')} error={fieldError(errors, 'deletion.orderReference')} />
        )}

        {reason === 'DUPLICATE_ACCOUNT' && (
          <SelectField
            id="primaryAccountToRetain"
            label="Primary Account to be Retained"
            required
            options={emailOptions.filter((o) => o.value !== selectedEmail)}
            registration={register('deletion.primaryAccountToRetain')}
            error={fieldError(errors, 'deletion.primaryAccountToRetain')}
          />
        )}

        {reason === 'OTHER' && (
          <TextAreaField id="otherSpecify" label="Please specify" required registration={register('deletion.otherSpecify')} error={fieldError(errors, 'deletion.otherSpecify')} />
        )}
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="secondary" loading={busy === 'draft'} onClick={handleSaveDraft}>
          Save as Draft
        </Button>
        <Button type="submit" variant="danger" loading={busy === 'submit'}>
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
