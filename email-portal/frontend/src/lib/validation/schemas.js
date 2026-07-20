import { z } from 'zod';
import { GOV_EMAIL_REGEX, PHONE_REGEX, ACCOUNT_BASES, MODIFICATION_TYPES, DELETION_REASONS } from '../constants';

/**
 * One schema block per form, matching backend/src/models/RequestForm.js
 * field-for-field. Cross-field rules (postOrOfficeName required unless
 * NAME_BASED, conditional modification/deletion fields) mirror the checks
 * already enforced server-side in services/requestService.js and
 * controllers/requestController.js — this is client-side UX only, the
 * backend remains the real authority and re-validates everything.
 */

const applicantSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name is required.'),
    designation: z.string().trim().min(2, 'Designation is required.'),
    departmentOffice: z.string().trim().min(2, 'Department/Office is required.'),
    dob: z.string().min(1, 'Date of birth is required.'),
    retirementOrExpiryDate: z.string().min(1, 'Date of retirement/expiry is required.'),
    personalEmail: z.string().trim().toLowerCase().email('Enter a valid personal email address.').optional().or(z.literal('')),
    personalPhone: z.string().trim().regex(PHONE_REGEX, 'Enter a valid 10-digit mobile number.'),
    purpose: z.string().trim().min(10, 'Please provide a justification (min. 10 characters).'),
    preferredEmailId: z.string().trim().toLowerCase().regex(GOV_EMAIL_REGEX, 'Must be a valid address ending in @assam.gov.in'),
    postOrOfficeName: z.string().trim().optional().or(z.literal(''))
  })
  .refine(
    (data) => {
      if (!data.dob || !data.retirementOrExpiryDate) return true;
      return new Date(data.retirementOrExpiryDate) > new Date(data.dob);
    },
    { message: 'Retirement/expiry date must be after date of birth.', path: ['retirementOrExpiryDate'] }
  );

export const singleCreationSchema = z
  .object({
    accountBasis: z.enum(ACCOUNT_BASES, { errorMap: () => ({ message: 'Please select an account basis.' }) }),
    applicant: applicantSchema
  })
  .superRefine((data, ctx) => {
    if (data.accountBasis !== 'NAME_BASED' && !data.applicant.postOrOfficeName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applicant', 'postOrOfficeName'],
        message: 'Required for Designation-based or Office-based accounts.'
      });
    }
  });

export const bulkMetaSchema = z.object({
  accountBasis: z.enum(ACCOUNT_BASES, { errorMap: () => ({ message: 'Please select an account basis.' }) }),
  nodalOfficer: z.object({
    name: z.string().trim().min(2, 'Required.'),
    designation: z.string().trim().min(2, 'Required.'),
    departmentOffice: z.string().trim().min(2, 'Required.'),
    officialEmail: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    mobile: z.string().trim().regex(PHONE_REGEX, 'Enter a valid 10-digit mobile number.'),
    projectPurpose: z.string().trim().min(10, 'Please provide a justification (min. 10 characters).')
  })
});

export const modificationSchema = z
  .object({
    modification: z.object({
      existingEmailAddress: z.string().trim().toLowerCase().regex(GOV_EMAIL_REGEX, 'Select a valid existing account.'),
      modificationType: z.enum(MODIFICATION_TYPES, { errorMap: () => ({ message: 'Please select a modification type.' }) }),
      reason: z.string().trim().min(10, 'Please provide a reason (min. 10 characters).'),
      newCustodianName: z.string().trim().optional().or(z.literal('')),
      newCustodianDesignation: z.string().trim().optional().or(z.literal('')),
      newValidityDate: z.string().optional().or(z.literal('')),
      otherDetails: z.string().trim().optional().or(z.literal(''))
    })
  })
  .superRefine((data, ctx) => {
    const m = data.modification;
    if (m.modificationType === 'CUSTODIAN_CHANGE') {
      if (!m.newCustodianName?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['modification', 'newCustodianName'], message: 'Required for a custodian change.' });
      }
      if (!m.newCustodianDesignation?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['modification', 'newCustodianDesignation'], message: 'Required for a custodian change.' });
      }
    }
    if (m.modificationType === 'VALIDITY_EXTENSION' && !m.newValidityDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['modification', 'newValidityDate'], message: 'Required for a validity extension.' });
    }
    if (m.modificationType === 'OTHER' && !m.otherDetails?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['modification', 'otherDetails'], message: 'Please specify details.' });
    }
  });

export const deletionSchema = z
  .object({
    deletion: z.object({
      existingEmailAddress: z.string().trim().toLowerCase().regex(GOV_EMAIL_REGEX, 'Select a valid existing account.'),
      accountHolderName: z.string().trim().min(2, 'Required.'),
      designation: z.string().trim().optional().or(z.literal('')),
      departmentOffice: z.string().trim().optional().or(z.literal('')),
      dob: z.string().optional().or(z.literal('')),
      retirementOrExpiryDate: z.string().optional().or(z.literal('')),
      mobile: z.string().trim().optional().or(z.literal('')),
      reason: z.enum(DELETION_REASONS, { errorMap: () => ({ message: 'Please select a reason.' }) }),
      orderReference: z.string().trim().optional().or(z.literal('')),
      primaryAccountToRetain: z.string().trim().toLowerCase().optional().or(z.literal('')),
      otherSpecify: z.string().trim().optional().or(z.literal(''))
    })
  })
  .superRefine((data, ctx) => {
    const d = data.deletion;
    if (d.reason === 'DISCIPLINARY_ACTION' && !d.orderReference?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deletion', 'orderReference'], message: 'Order reference is required.' });
    }
    if (d.reason === 'DUPLICATE_ACCOUNT' && !d.primaryAccountToRetain?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deletion', 'primaryAccountToRetain'], message: 'Please specify the account to retain.' });
    }
    if (d.reason === 'OTHER' && !d.otherSpecify?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deletion', 'otherSpecify'], message: 'Please specify details.' });
    }
  });

export const reviewActionSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT', 'REVERT']),
    comments: z.string().trim().optional().or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REVERT' && !data.comments?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['comments'], message: 'Comments are required when reverting a request.' });
    }
  });
