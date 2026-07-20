import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { modificationSchema } from '../../lib/validation/schemas';
import { MODIFICATION_TYPE_OPTIONS } from '../../lib/constants';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage, toInputDate, fieldError } from '../../lib/utils';
import useOfficeRegistry from '../../hooks/api/useOfficeRegistry';
import ToggleGroup from '../ui/toggleGroup';
import { TextField, DateField, TextAreaField, SelectField } from '../ui/formControls';
import { Button, Alert, Spinner } from '../ui/primitives';
import styles from './formShell.module.css';

function defaultsFromRequest(request) {
  if (!request) {
    return {
      modification: {
        existingEmailAddress: '', modificationType: '', reason: '',
        newCustodianName: '', newCustodianDesignation: '', newValidityDate: '', otherDetails: ''
      }
    };
  }
  const m = request.modification || {};
  return {
    modification: {
      existingEmailAddress: m.existingEmailAddress || '',
      modificationType: m.modificationType || '',
      reason: m.reason || '',
      newCustodianName: m.newCustodianName || '',
      newCustodianDesignation: m.newCustodianDesignation || '',
      newValidityDate: toInputDate(m.newValidityDate),
      otherDetails: m.otherDetails || ''
    }
  };
}

/**
 * Form EM-04 — Account Modification: custodian change, validity extension,
 * or other, each with its own reason. The existing account is picked from
 * the office's live Active registry (see useOfficeRegistry) rather than
 * free-typed, since services/requestService.js's assertRegistryOwnership
 * will reject anything that doesn't already exist / belong to this office.
 */
export default function ModificationForm({ mode = 'create', request, onDone, onCancel }) {
  const { records, loading: registryLoading } = useOfficeRegistry();
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(null);

  const { register, handleSubmit, watch, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(modificationSchema),
    defaultValues: defaultsFromRequest(request)
  });

  const modificationType = watch('modification.modificationType');

  const emailOptions = records.map((r) => ({
    value: r.emailAddress,
    label: `${r.emailAddress} — ${r.currentCustodian?.name || ''} (${r.officeName})`
  }));

  const handleSaveDraft = async () => {
    setSubmitError('');
    setBusy('draft');
    try {
      const values = getValues();
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, values);
      } else {
        await requestsApi.createModification({ ...values, saveAsDraft: true });
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
        await requestsApi.createModification({ ...values, saveAsDraft: false });
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
        <h3 className={styles.sectionTitle}>Existing account</h3>
        {registryLoading ? (
          <Spinner label="Loading your office's accounts…" />
        ) : (
          <SelectField
            id="existingEmailAddress"
            label="Existing Email Address"
            required
            options={emailOptions}
            registration={register('modification.existingEmailAddress')}
            error={fieldError(errors, 'modification.existingEmailAddress')}
          />
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Modification type</h3>
        <ToggleGroup
          legend="Type of modification requested"
          options={MODIFICATION_TYPE_OPTIONS}
          registration={register('modification.modificationType')}
          error={fieldError(errors, 'modification.modificationType')}
          required
        />

        {modificationType === 'CUSTODIAN_CHANGE' && (
          <div className={styles.grid2}>
            <TextField id="newCustodianName" label="New Custodian Name" required registration={register('modification.newCustodianName')} error={fieldError(errors, 'modification.newCustodianName')} />
            <TextField id="newCustodianDesignation" label="New Custodian Designation" required registration={register('modification.newCustodianDesignation')} error={fieldError(errors, 'modification.newCustodianDesignation')} />
          </div>
        )}

        {modificationType === 'VALIDITY_EXTENSION' && (
          <DateField id="newValidityDate" label="New Validity/Expiry Date" required registration={register('modification.newValidityDate')} error={fieldError(errors, 'modification.newValidityDate')} />
        )}

        {modificationType === 'OTHER' && (
          <TextAreaField id="otherDetails" label="Please specify" required registration={register('modification.otherDetails')} error={fieldError(errors, 'modification.otherDetails')} />
        )}

        <TextAreaField id="reason" label="Reason for this modification" required registration={register('modification.reason')} error={fieldError(errors, 'modification.reason')} />
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
