import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogContent from './CustomDialog/CustomDialogContent';

export default function ContentFullScreen({ children, title, fullScreen, setFullScreen, isheader = true }) {
  return fullScreen ? (
    <Dialog fullScreen={true} aria-labelledby="customized-dialog-title" open={true} disableEnforceFocus>
      <CustomDialogContent isFooterPresent={false}>{children}</CustomDialogContent>
    </Dialog>
  ) : (
    children
  );
}
