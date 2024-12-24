import { useState } from 'react';
import { Box, Button } from '@mui/material';
import FaceDialog from './faceDialog';
import MfaAuthDialog from './mfaAuthDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CustomContainer from 'src/components/CustomContainer';

function UserAttendance() {
  const [openDialog, setOpenDialog] = useState({ open: false, type: '' });

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.userAttendance]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <Box width={'100%'} display={'flex'} justifyContent={'center'}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenDialog({ open: true, type: 'face' });
              }}
            >
              Face Verification
            </Button>
            <Box ml={2} />
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenDialog({ open: true, type: 'mfa' });
              }}
            >
              MFA Verification
            </Button>
          </Box>
        </div>
      </CustomContainer>
      {openDialog.open && openDialog.type === 'face' && (
        <FaceDialog
          onClose={() => {
            setOpenDialog({ open: false, type: '' });
          }}
        />
      )}
      {openDialog.open && openDialog.type === 'mfa' && (
        <MfaAuthDialog
          onClose={() => {
            setOpenDialog({ open: false, type: '' });
          }}
        />
      )}
    </section>
  );
}

export default UserAttendance;
