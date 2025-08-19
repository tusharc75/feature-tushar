import { Box } from '@mui/material';
import DefaultRecordDialog from './DefaultRecordDialog';

const UiPreference = ({ userData, onSuccess }) => {

  return (
    <>
      <Box style={{ marginTop: '16px' }}>
        <DefaultRecordDialog
          userData={userData}
          onSuccess={onSuccess}
        />
      </Box>
    </>
  );
};

export default UiPreference;
