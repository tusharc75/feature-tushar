import { Avatar, Box, CircularProgress, IconButton, Typography } from '@material-ui/core';
import { Image } from '@material-ui/icons';
import { useContext, useState } from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import { imageUploadMaxSize } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

const ImageUpload = ({ values, name, setFieldValue, touched, errors }) => {
  const { setToastConfig } = useContext(CustomToastContext);

  const [isImgUploading, setImgUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [image, setImage] = useState<any>('');
  const [imageFileName, setImageFileName] = useState<any>('');

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];

      //  1048576 = 1 MB
      if (file.size > imageUploadMaxSize.size) {
        setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }

      event.target.value = '';
    }
  };

  const getImageUrl = (file, multiple = null) => {
    setImageUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    setImgUploading(true);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setImageUploadProgress(completedPercent);
          if (completedPercent === 100) {
            setTimeout(() => {
              setImageUploadProgress(0);
            }, 4000);
          }
        }
      })
      .then(({ data }) => {
        if (!multiple) {
          setFieldValue(name, data.fileUrl);
        } else {
          if (values[name]) {
            setImage('');
            setFieldValue(name, [...values[name], data.fileUrl]);
            setImageFileName('');
          } else {
            let currentData = values[name] ? values[name] : [];
            setImage('');
            setFieldValue(name, [...currentData, data.fileUrl]);
            setImageFileName('');
          }
        }
        setImgUploading(false);
      })
      .catch((err) => {
        if (multiple) {
          setImage('');
          setImageFileName('');
        }
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
      });
  };

  return (
    <>
      <Box display="flex" flexDirection="row" mt={1}>
        <Box position="relative">
          <Avatar src={values[name]} style={{ width: 70, height: 70 }} alt="org_logo">
            <Image style={{ fontSize: 50 }} />
          </Avatar>
          <Box display="flex" justifyContent="center" alignItems="center" position="absolute" top="0" right="0" width="100%" height="100%">
            {isImgUploading && (
              <>
                <CircularProgress variant="determinate" value={imageUploadProgress} />
                <Box top={0} left={0} bottom={0} right={0} position="absolute" display="flex" alignItems="center" justifyContent="center">
                  <Typography variant="caption" component="div" color="textSecondary">{`${imageUploadProgress}%`}</Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>
        <Box>
          <label htmlFor={name}>
            <IconButton title="Add picture" color="primary" size="small" aria-label="upload picture" component="span">
              <AddCircleIcon />
              <input
                onClick={(e: any) => (e.target.value = null)}
                disabled={isImgUploading}
                id={name}
                name={name}
                onChange={handleUploadImage}
                accept="image/x-png,image/gif,image/jpeg"
                style={{
                  opacity: '0',
                  position: 'absolute',
                  zIndex: -1
                }}
                type="file"
              />
            </IconButton>
          </label>

          <IconButton
            disabled={Boolean(!values[name])}
            title="Remove picture"
            className={Boolean(!values[name]) ? '' : 'errorColor'}
            size="small"
            aria-label="delete picture"
            component="span"
            onClick={() => setFieldValue(name, '')}
          >
            <DeleteIcon />
          </IconButton>
          <Box flex="1">
            <Typography
              variant="body2"
              className="text-truncate"
              style={{
                marginLeft: '4px',
                display: touched[name] && Boolean(errors[name]) ? '' : 'none'
              }}
              color={touched[name] && Boolean(errors[name]) ? 'error' : 'textPrimary'}
            >
              {touched[name] && Boolean(errors[name]) ? errors[name] : null}
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default ImageUpload;
