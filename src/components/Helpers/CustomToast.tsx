import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

const CustomToast = (props) => {
  const { open, close, message, type, hideDuration = 6000 } = props;

  return (
    <>
      {open && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Snackbar
            open={open}
            autoHideDuration={hideDuration}
            onClose={close}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert
              onClose={close}
              severity={type}
              variant="filled"
              sx={{ width: '100%' }}
            >
              {message}
            </Alert>
          </Snackbar>
        </Box>
      )}
    </>
  );
};

CustomToast.propTypes = {
  open: PropTypes.bool.isRequired,
  close: PropTypes.func.isRequired,
  message: PropTypes.any.isRequired,
  type: PropTypes.string.isRequired,
};

export default CustomToast;
