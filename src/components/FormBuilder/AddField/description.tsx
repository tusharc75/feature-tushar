import { Box } from '@mui/material';
import TinyMCE from 'src/components/TinyMCE';

const Description = ({ values, setFieldValue }) => {
  return (
    <Box>
      <TinyMCE
        onChange={(value) => {
          setFieldValue('htmlDescription', value);
        }}
        initialValue={values}
        imageOrFileUploadCompletePercentage={(completePercentage) => { }}
        usePublicUrlforFileUpload={true}
        doNotShowUploadFile={true}
      />
    </Box>
  );
};

export default Description;
