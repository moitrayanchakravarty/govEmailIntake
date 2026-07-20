import { FORM_TYPE_META, ACCOUNT_BASIS_OPTIONS, MODIFICATION_TYPE_OPTIONS, DELETION_REASON_OPTIONS } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import styles from './detailFields.module.css';
import BulkReviewTable from '../forms/bulkReviewTable';

function Item({ label, value }) {
  return (
    <div className={styles.item}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value || '—'}</span>
    </div>
  );
}

const labelFor = (options, value) => options.find((o) => o.value === value)?.label || value;

export default function RequestDetailFields({ request }) {
  const meta = FORM_TYPE_META[request.formType];

  return (
    <>
      <div className={styles.grid}>
        <Item label="Request ID" value={request.requestId || 'Not yet submitted'} />
        <Item label="Form" value={meta?.label} />
        <Item label="Office" value={request.officeName} />
        <Item label="Submitted By" value={request.submittedBy?.name} />
      </div>

      {(request.formType === 'SINGLE_CREATION') && request.applicant && (
        <>
          <p className={styles.sectionTitle}>Applicant details</p>
          <div className={styles.grid}>
            <Item label="Account Basis" value={labelFor(ACCOUNT_BASIS_OPTIONS, request.accountBasis)} />
            <Item label="Full Name" value={request.applicant.fullName} />
            <Item label="Designation" value={request.applicant.designation} />
            <Item label="Department/Office" value={request.applicant.departmentOffice} />
            {request.applicant.postOrOfficeName && <Item label="Post/Office Name" value={request.applicant.postOrOfficeName} />}
            <Item label="DOB" value={formatDate(request.applicant.dob)} />
            <Item label="Retirement/Expiry" value={formatDate(request.applicant.retirementOrExpiryDate)} />
            <Item label="Personal Email" value={request.applicant.personalEmail} />
            <Item label="Personal Phone" value={request.applicant.personalPhone} />
            <Item label="Preferred Email ID" value={request.applicant.preferredEmailId} />
          </div>
          <Item label="Purpose/Justification" value={request.applicant.purpose} />
        </>
      )}

      {request.formType === 'BULK_CREATION' && (
        <>
          <p className={styles.sectionTitle}>Nodal Officer</p>
          <div className={styles.grid}>
            <Item label="Account Basis" value={labelFor(ACCOUNT_BASIS_OPTIONS, request.accountBasis)} />
            <Item label="Name" value={request.nodalOfficer?.name} />
            <Item label="Designation" value={request.nodalOfficer?.designation} />
            <Item label="Department/Office" value={request.nodalOfficer?.departmentOffice} />
            <Item label="Official Email" value={request.nodalOfficer?.officialEmail} />
            <Item label="Mobile" value={request.nodalOfficer?.mobile} />
          </div>
          <Item label="Purpose/Justification" value={request.nodalOfficer?.projectPurpose} />
          <p className={styles.sectionTitle} style={{ marginTop: 'var(--space-4)' }}>
            Applicants ({request.bulkApplicants?.length || 0})
          </p>
          <BulkReviewTable rows={request.bulkApplicants || []} />
        </>
      )}

      {request.formType === 'MODIFICATION' && request.modification && (
        <>
          <p className={styles.sectionTitle}>Modification details</p>
          <div className={styles.grid}>
            <Item label="Existing Email" value={request.modification.existingEmailAddress} />
            <Item label="Type" value={labelFor(MODIFICATION_TYPE_OPTIONS, request.modification.modificationType)} />
            {request.modification.newCustodianName && <Item label="New Custodian" value={request.modification.newCustodianName} />}
            {request.modification.newCustodianDesignation && <Item label="New Custodian Designation" value={request.modification.newCustodianDesignation} />}
            {request.modification.newValidityDate && <Item label="New Validity Date" value={formatDate(request.modification.newValidityDate)} />}
            {request.modification.otherDetails && <Item label="Details" value={request.modification.otherDetails} />}
          </div>
          <Item label="Reason" value={request.modification.reason} />
        </>
      )}

      {request.formType === 'DELETION' && request.deletion && (
        <>
          <p className={styles.sectionTitle}>Deletion / Surrender details</p>
          <div className={styles.grid}>
            <Item label="Existing Email" value={request.deletion.existingEmailAddress} />
            <Item label="Account Holder" value={request.deletion.accountHolderName} />
            <Item label="Reason" value={labelFor(DELETION_REASON_OPTIONS, request.deletion.reason)} />
            {request.deletion.orderReference && <Item label="Order Reference" value={request.deletion.orderReference} />}
            {request.deletion.primaryAccountToRetain && <Item label="Primary Account Retained" value={request.deletion.primaryAccountToRetain} />}
            {request.deletion.otherSpecify && <Item label="Details" value={request.deletion.otherSpecify} />}
          </div>
        </>
      )}
    </>
  );
}
