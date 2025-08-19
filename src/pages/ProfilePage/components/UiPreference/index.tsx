import { Box } from '@mui/material';
import DefaultRecordDialog from './DefaultRecordDialog';

const UiPreference = ({ userData, onSuccess }) => {

  return (
    <>
      <Box>
        <Box mb={4} border={1} borderColor="grey.300" borderRadius={2}>
          <div className={'form-head-v1'}>
            <h3 className="form-label-style-v1" title="Your UI Preference">
              Your UI Preference
            </h3>
          </div>

        </Box>
        <Box style={{ marginTop: '16px' }}>
          <DefaultRecordDialog
            userData={userData}
            onSuccess={onSuccess}
          />
        </Box>
      </Box>
    </>
  );
};

export default UiPreference;
