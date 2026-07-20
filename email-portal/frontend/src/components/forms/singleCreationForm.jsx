import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { singleCreationSchema } from '../../lib/validation/schemas';
import { ACCOUNT_BASIS_OPTIONS } from '../../lib/constants';
import { requestsApi } from '../../lib/api/requestsApi';
import { getErrorMessage, toInputDate, fieldError } from '../../lib/utils';
import useEmailAvailability from '../../hooks/api/useEmailAvailability';
import ToggleGroup from '../ui/toggleGroup';
import { TextField, DateField, TextAreaField } from '../ui/formControls';
import { Button, Alert, Badge } from '../ui/primitives';
import styles from './formShell.module.css';

const EMPTY_APPLICANT = {
  fullName: '', designation: '', departmentOffice: '', dob: '', retirementOrExpiryDate: '',
  personalEmail: '', personalPhone: '', purpose: '', preferredEmailId: '', postOrOfficeName: ''
};

function defaultsFromRequest(request) {
  if (!request) return { accountBasis: '', applicant: EMPTY_APPLICANT };
  const a = request.applicant || {};
  return {
    accountBasis: request.accountBasis || '',
    applicant: {
      ...EMPTY_APPLICANT,
      ...a,
      dob: toInputDate(a.dob),
      retirementOrExpiryDate: toInputDate(a.retirementOrExpiryDate)
    }
  };
}

const AVAILABILITY_LABEL = {
  checking: 'Checking…',
  available: 'Available',
  unavailable: 'Already taken',
  invalid: 'Invalid format',
  error: 'Check failed'
};

/**
 * Form EM-01 — Single Account Creation. Also covers the Designation-based
 * and Office-based single-account path via the accountBasis toggle,
 * per the policy decision (see models/RequestForm.js header comment) to
 * fold EM-03 into this same form rather than building a second one.
 *
 * mode:
 *  - 'create'     : brand-new request (default)
 *  - 'edit-draft' : continuing a previously saved Draft (request prop set)
 *  - 'resubmit'   : responding to a Reverted request (request prop set)
 */
export default function SingleCreationForm({ mode = 'create', request, onDone, onCancel }) {
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(null); // 'draft' | 'submit' | null

  const {
    register, handleSubmit, watch, getValues, formState: { errors }
  } = useForm({
    resolver: zodResolver(singleCreationSchema),
    defaultValues: defaultsFromRequest(request)
  });

  const accountBasis = watch('accountBasis');
  const preferredEmailId = watch('applicant.preferredEmailId');
  const availability = useEmailAvailability(preferredEmailId);

  const handleSaveDraft = async () => {
    setSubmitError('');
    setBusy('draft');
    try {
      const values = getValues();
      if (mode === 'edit-draft') {
        await requestsApi.updateDraft(request._id, values);
      } else {
        await requestsApi.createSingle({ ...values, saveAsDraft: true });
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
        await requestsApi.createSingle({ ...values, saveAsDraft: false });
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
          legend="This account will be created on the basis of"
          options={ACCOUNT_BASIS_OPTIONS}
          registration={register('accountBasis')}
          error={errors.accountBasis?.message}
          required
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Details of the person in whose favour this email is requested</h3>

        <div className={styles.grid2}>
          <TextField id="fullName" label="Full Name" required registration={register('applicant.fullName')} error={fieldError(errors, 'applicant.fullName')} />
          <TextField id="designation" label="Designation" required registration={register('applicant.designation')} error={fieldError(errors, 'applicant.designation')} />
        </div>

        <TextField id="departmentOffice" label="Department/Office" required registration={register('applicant.departmentOffice')} error={fieldError(errors, 'applicant.departmentOffice')} />

        {accountBasis && accountBasis !== 'NAME_BASED' && (
          <TextField
            id="postOrOfficeName"
            label={accountBasis === 'DESIGNATION_BASED' ? 'Name of the Post' : 'Name of the Office'}
            required
            hint="This account is tied to the post/office itself, and will persist across whoever holds it."
            registration={register('applicant.postOrOfficeName')}
            error={fieldError(errors, 'applicant.postOrOfficeName')}
          />
        )}

        <div className={styles.grid2}>
          <DateField id="dob" label="Date of Birth" required registration={register('applicant.dob')} error={fieldError(errors, 'applicant.dob')} />
          <DateField id="retirementOrExpiryDate" label="Date of Retirement/Expiry" required registration={register('applicant.retirementOrExpiryDate')} error={fieldError(errors, 'applicant.retirementOrExpiryDate')} />
        </div>

        <div className={styles.grid2}>
          <TextField id="personalEmail" label="Personal Email ID" type="email" registration={register('applicant.personalEmail')} error={fieldError(errors, 'applicant.personalEmail')} />
          <TextField id="personalPhone" label="Personal Phone Number" required registration={register('applicant.personalPhone')} error={fieldError(errors, 'applicant.personalPhone')} />
        </div>

        <TextAreaField id="purpose" label="Purpose/Justification for Email" required registration={register('applicant.purpose')} error={fieldError(errors, 'applicant.purpose')} />

        <TextField
          id="preferredEmailId"
          label="Preferred Email ID"
          required
          hint="Must end with @assam.gov.in"
          registration={register('applicant.preferredEmailId')}
          error={fieldError(errors, 'applicant.preferredEmailId')}
          statusAdornment={
            preferredEmailId && availability.status !== 'idle' ? (
              <Badge variant={availability.status === 'available' ? 'success' : availability.status === 'checking' ? 'neutral' : 'danger'}>
                {AVAILABILITY_LABEL[availability.status]}
              </Badge>
            ) : null
          }
        />
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
