import Alert, { AlertProps } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';

export type CustomToastProps = {
  open: boolean;
  message: string;
  type: AlertProps['severity'] | 'notFoundError';
  hideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
};
type ExtraAttributes = {
  close: () => void;
};

const CustomToast = ({ open, close, message, type, hideDuration = 6000 }: CustomToastProps & ExtraAttributes) => {
  return (
    <>
      {open && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Snackbar open={open} autoHideDuration={hideDuration} onClose={close} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert onClose={close} severity={type as AlertProps['severity']} variant="filled" sx={{ width: '100%', color: 'white' }}>
              {message}
            </Alert>
          </Snackbar>
        </Box>
      )}
    </>
  );
};

export default CustomToast;
