import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import { CustomDialogTransition, sidebarResource } from '../../../constants/helpers';
import ResourceLogsGrid from 'src/pages/ResourceLogs/ResourceLogsGrid';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';

type HistoryDialogProps = {
  onClose: () => void;
  open: boolean;
  resourceId: string;
  resource: string;
  resourceLabel?: string;
};
export default function HistoryDialog({ onClose, open, resourceId, resource, resourceLabel = '' }: HistoryDialogProps) {
  return (
    <Dialog
      disableBackdropClick
      disableEscapeKeyDown
      fullWidth
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullScreen
      aria-labelledby="confirmation-dialog-title"
      open={open}
      onClose={onClose}
    >
      <CustomDialogHeader title={<>History: {resourceLabel}</>} showManimizeMaximize={false} showRequiredLabel={false} onClose={onClose} />
      <CustomDialogContent isFooterPresent={false}>
        <ResourceLogsGrid selectedResource={sidebarResource[resource]} selectedOption={resourceId} hideResourceField={true} />
      </CustomDialogContent>
    </Dialog>
  );
}
