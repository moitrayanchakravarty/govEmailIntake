import SingleCreationForm from './singleCreationForm';
import BulkCreationForm from './bulkCreationForm';
import ModificationForm from './modificationForm';
import DeletionForm from './deletionForm';

const FORM_COMPONENTS = {
  SINGLE_CREATION: SingleCreationForm,
  BULK_CREATION: BulkCreationForm,
  MODIFICATION: ModificationForm,
  DELETION: DeletionForm
};

/**
 * Single dispatch point so the dashboard doesn't need a switch statement
 * every place it wants to render "whichever form matches this formType".
 */
export default function RequestFormRouter({ formType, mode, request, onDone, onCancel }) {
  const Component = FORM_COMPONENTS[formType];
  if (!Component) return null;
  return <Component mode={mode} request={request} onDone={onDone} onCancel={onCancel} />;
}
