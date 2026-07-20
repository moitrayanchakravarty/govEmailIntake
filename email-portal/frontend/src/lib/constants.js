// Mirrors backend/src/models/MasterRegistry.js's GOV_EMAIL_REGEX exactly —
// keep these in sync if that ever changes.
export const GOV_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@assam\.gov\.in$/;
export const PHONE_REGEX = /^(\+91[-\s]?)?[6-9]\d{9}$/;

export const ACCOUNT_BASIS_OPTIONS = [
  { value: 'NAME_BASED', label: 'Name-based' },
  { value: 'DESIGNATION_BASED', label: 'Designation-based' },
  { value: 'OFFICE_BASED', label: 'Office-based' }
];

export const MODIFICATION_TYPE_OPTIONS = [
  { value: 'CUSTODIAN_CHANGE', label: 'Custodian Change', hint: 'Handover this account to a new holder' },
  { value: 'VALIDITY_EXTENSION', label: 'Extension of Validity', hint: "Extend the account's expiry date" },
  { value: 'OTHER', label: 'Other', hint: 'Any other modification, with specification' }
];

export const DELETION_REASON_OPTIONS = [
  { value: 'SUPERANNUATION_RETIREMENT', label: 'Superannuation / Retirement' },
  { value: 'CONTRACT_EXPIRY', label: 'Expiry / Completion of Contract or Consultancy' },
  { value: 'VOLUNTARY_SURRENDER', label: 'Voluntary Surrender (no longer required for official use)' },
  { value: 'DISCIPLINARY_ACTION', label: 'Disciplinary / Administrative Action' },
  { value: 'POST_ABOLISHED', label: 'Post Abolished / Office Merged or Closed' },
  { value: 'DUPLICATE_ACCOUNT', label: 'Duplicate Account' },
  { value: 'OTHER', label: 'Other' }
];

export const ACCOUNT_BASES = ACCOUNT_BASIS_OPTIONS.map((o) => o.value);
export const MODIFICATION_TYPES = MODIFICATION_TYPE_OPTIONS.map((o) => o.value);
export const DELETION_REASONS = DELETION_REASON_OPTIONS.map((o) => o.value);

export const FORM_TYPE_META = {
  SINGLE_CREATION: { code: 'EM-01', label: 'Single Account Creation' },
  BULK_CREATION: { code: 'EM-02', label: 'Bulk Account Creation' },
  MODIFICATION: { code: 'EM-04', label: 'Account Modification' },
  DELETION: { code: 'EM-05', label: 'Deletion / Surrender' }
};

export const STATUS_META = {
  Draft: { label: 'Draft', variant: 'neutral' },
  Pending: { label: 'Pending Review', variant: 'warning' },
  Approved: { label: 'Approved', variant: 'success' },
  Rejected: { label: 'Rejected', variant: 'danger' },
  Reverted: { label: 'Reverted — Action Needed', variant: 'accent' }
};

export const MAX_BULK_ROWS = 50;
