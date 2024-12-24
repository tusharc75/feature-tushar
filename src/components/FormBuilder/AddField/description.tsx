import { Box } from '@mui/material';
import { useContext } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import TinyMCE from 'src/components/TinyMCE';

const Description = ({ values, setFieldValue }) => {
  const toastConfig = useContext(CustomToastContext);

  return (
    <Box>
      <TinyMCE
        onChange={(value) => {
          setFieldValue('htmlDescription', value);
        }}
        initialValue={values}
        imageOrFileUploadCompletePercentage={(completePercentage) => {}}
        doNotShowUploadFile={true}
        usePublicUrlforFileUpload={true}
      />
    </Box>
  );
};

export default Description;
