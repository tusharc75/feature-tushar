import Dialog from '@material-ui/core/Dialog/Dialog';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import { Close } from '@material-ui/icons';
import { IconButton } from '@material-ui/core';

export default function ContentFullScreen({ children, fullScreen, setFullScreen }) {
  return fullScreen ? (
    <Dialog fullScreen={true} aria-labelledby="customized-dialog-title" open={true} disableEnforceFocus>
      <CustomDialogContent isFooterPresent={false}>
        <div className="flex justify-end">
          <IconButton
            title="Close"
            size="small"
            aria-label="Close"
            onClick={() => {
              setFullScreen(false);
            }}
          >
            <Close fontSize="small" color="primary" />
          </IconButton>
        </div>
        {children}
      </CustomDialogContent>
    </Dialog>
  ) : (
    children
  );
}
