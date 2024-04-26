import { Box } from '@material-ui/core';
import { useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import TinyMCE from 'src/components/TinyMCE';
import { imageUploadMaxSize } from 'src/constants/helpers';

const Description = ({ values, setFieldValue }) => {
  const toastConfig = useContext(CustomToastContext);

  return (
    <Box>
      <TinyMCE
        onChange={(value) => {
          setFieldValue('htmlDescription', value);
        }}
        initialValue={values['htmlDescription'] || ''}
        imageOrFileUploadCompletePercentage={(completePercentage) => {}}
        doNotShowUploadFile={true}
        usePublicUrlforFileUpload={true}
      />
    </Box>
  );
};

export default Description;
