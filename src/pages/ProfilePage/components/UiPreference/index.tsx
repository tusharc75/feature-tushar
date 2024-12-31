import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import styles from '../../profilePage.module.scss';
import DefaultRecordDialog from './DefaultRecordDialog';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const UiPreference = ({ userData, onSuccess }) => {
  const [byDefaultRecordDialog, setByDefaultRecordDialog] = useState(false);

  return (
    <>
      <div className={styles.preferenceHeader}>
        <Typography variant="h5">Your UI Preference</Typography>
      </div>
      <Box style={{ padding: '8px' }}>
        <div className="header-panel">
          <ThemeButton
            buttonType="theme"
            onClick={() => {
              setByDefaultRecordDialog(true);
            }}
          >
            By Default Record
          </ThemeButton>
        </div>
      </Box>
      {byDefaultRecordDialog && (
        <DefaultRecordDialog
          userData={userData}
          handleClose={() => {
            setByDefaultRecordDialog(false);
          }}
          onSuccess={() => {
            setByDefaultRecordDialog(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
};

export default UiPreference;
