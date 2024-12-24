import Dialog from '@mui/material/Dialog/Dialog';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import { Close } from '@material-ui/icons';
import { IconButton } from '@mui/material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export default function ContentFullScreen({ children, fullScreen, setFullScreen }) {
  return fullScreen ? (
    <Dialog
      fullScreen={true}
      onClose={() => {
        setFullScreen(false);
      }}
      aria-labelledby="customized-dialog-title"
      className="mt-0"
      open={true}
      disableEnforceFocus
    >
      <div className="absolute right-1 top-1 z-50">
        <HtmlTooltip title="Exit full screen">
          <IconButton
            aria-label="Close"
            onClick={() => {
              setFullScreen(false);
            }}
          >
            <Close fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      </div>
      <CustomDialogContent isFooterPresent={false}>{children}</CustomDialogContent>
    </Dialog>
  ) : (
    children
  );
}
