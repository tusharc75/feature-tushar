import { useState } from 'react';
import { Box } from '@mui/material';
import FaceDialog from './faceDialog';
import MfaAuthDialog from './mfaAuthDialog';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CustomContainer from 'src/components/CustomContainer';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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
            <ThemeButton
             buttonType="theme"
              onClick={() => {
                setOpenDialog({ open: true, type: 'face' });
              }}
            >
              Face Verification
            </ThemeButton>
            <Box ml={2} />
            <ThemeButton
              buttonType="theme"
              onClick={() => {
                setOpenDialog({ open: true, type: 'mfa' });
              }}
            >
              MFA Verification
            </ThemeButton>
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
