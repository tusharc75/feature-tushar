import React, { useContext, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Box, Button, CircularProgress, Dialog, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { HiOutlinePhotograph } from 'react-icons/hi';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, imageUploadMaxSize } from 'src/constants/helpers';
import { AiOutlineClose } from 'react-icons/ai';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  errorText: {
    color: theme.palette.error.main
  },
  buttonContainer: {
    display: 'flex',
    padding: '4px',
    paddingLeft: '5px',
    border: '1px solid lightgray',
    borderBottom: '0'
  },
  varibalesButton: {
    margin: '0 5px'
  }
}));

function RichTextEditor({ value, label, name, setFieldValue }) {
  const editorRef = useRef(null);
  const classes = useStyles();
  const [prevData, setPrevData] = useState('');
  const [isUpdate, setIsUpdate] = React.useState(true);
  const [isUploadImage, setIsUploadImage] = useState(false);
  const [isImgUploading, setImgUploading] = React.useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = React.useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [imageDetails, setImageDetails] = useState({ width: 0, height: 0, alt: '' });
  const { setToastConfig } = useContext(CustomToastContext);

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getFileUrl(file, '/user/upload-public', { isImage: true });
      }

      event.target.value = '';
    }
  };

  const getFileUrl = (file, api, details) => {
    setImageUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    let uploadUrl = api ? api : '/doc-parser';
    setImgUploading(true);
    axiosInstance()
      .post(uploadUrl, formData, {
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
        setImgUploading(false);
        if (details && details.isImage) {
          setUploadError(false);
          setImageUrl(data.fileUrl);
        } else {
          editorRef.current.execCommand('mceInsertContent', false, data);
        }
        //data.fileUrl data.fileName
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
      });
  };

  const handleSubmit = () => {
    if (!imageUrl) {
      setUploadError(true);
      return;
    }
    let imgTag = `<img src='${imageUrl}'`;
    if (imageDetails && imageDetails.width) {
      imgTag = `${imgTag} width='${imageDetails.width}'`;
    }
    if (imageDetails && imageDetails.height) {
      imgTag = `${imgTag} height='${imageDetails.height}'`;
    } else if (false) {
      imgTag = `${imgTag} height='${60}'`;
    }

    if (imageDetails && imageDetails.alt) {
      imgTag = `${imgTag} alt='${imageDetails.alt}'`;
    }
    imgTag = `${imgTag} />`;

    editorRef.current.execCommand('mceInsertContent', false, imgTag);

    setIsUploadImage(false);
    setImageUrl('');
    setImageDetails({ width: 0, height: 60, alt: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setImageDetails((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <Box>
      {label}
      {isUploadImage ? (
        <Dialog
          disableBackdropClick={true}
          open={true}
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="xs"
          onClose={() => setIsUploadImage(false)}
        >
          <CustomDialogHeader onClose={() => setIsUploadImage(false)} title="Upload Image"></CustomDialogHeader>

          <CustomDialogContent>
            <div>
              <Grid container spacing={3}>
                <Grid item xs={12} style={{ display: 'flex' }}>
                  <input
                    id="avatar"
                    name="avatar"
                    onChange={handleUploadImage}
                    accept="image/x-png,image/gif,image/jpeg"
                    style={{
                      opacity: '0',
                      position: 'absolute',
                      zIndex: -1
                    }}
                    onClick={(e: any) => (e.target.value = null)}
                    type="file"
                  />

                  <label htmlFor="avatar">
                    <IconButton title="Add picture" size="small" aria-label="upload picture" component="span">
                      <Button
                        startIcon={<HiOutlinePhotograph />}
                        // size="small"
                        variant="outlined"
                        component="span"
                        disabled={isImageLoading}
                      >
                        Upload Image
                      </Button>
                    </IconButton>
                  </label>
                  <Box display="flex">
                    {isImgUploading && (
                      <>
                        <CircularProgress variant="determinate" value={imageUploadProgress} />
                        <Box>
                          <Typography variant="caption" component="div" color="textSecondary">{`${imageUploadProgress}%`}</Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                </Grid>
                {imageUrl || uploadError ? (
                  <Grid item container>
                    {imageUrl ? (
                      <>
                        <Grid item xs={10}>
                          <Typography noWrap variant="body2">
                            {imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}
                          </Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Button size="small" startIcon={<AiOutlineClose />} onClick={() => setImageUrl('')} />
                        </Grid>
                      </>
                    ) : null}

                    {uploadError ? (
                      <Grid item xs={12}>
                        <Typography className={classes.errorText}>Please Upload Image/Photo</Typography>
                      </Grid>
                    ) : null}
                  </Grid>
                ) : null}
                <Grid item xs={6}>
                  <TextField id="width" type="number" name="width" size="small" label="Width" variant="outlined" onChange={handleChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    id="height"
                    name="height"
                    type="number"
                    onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                    size="small"
                    label="Height"
                    defaultValue={imageDetails.height}
                    variant="outlined"
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField id="alt" name="Alternative Text" size="small" label="alt" fullWidth variant="outlined" onChange={handleChange} />
                </Grid>
              </Grid>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              size="small"
              color="primary"
              onClick={() => {
                setImageDetails({ width: 0, height: 60, alt: '' });
                setImageUrl('');
                setIsUploadImage(false);
              }}
            >
              Cancel
            </Button>
            <Button variant="contained" color="primary" type="submit" onClick={handleSubmit}>
              Save
            </Button>
          </CustomDialogFooter>
        </Dialog>
      ) : null}

      {/* <Button
          size="small"
          color="primary"
          onClick={() => {
            setIsUploadImage(true);
          }}
        >
          Upload Image
        </Button> */}

      <Editor
        id={name}
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={isUpdate && value}
        onChange={(content: any) => {
          setIsUpdate(false);
          setFieldValue(name, content?.level?.content);
        }}
        init={{
          height: '150px',
          width: '100%',
          table_default_attributes: {
            border: '0'
          },
          block_formats: 'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3',
          font_formats: 'Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n',
          plugins: [
            'advlist autolink lists link charmap print preview anchor ',
            ' searchreplace visualblocks code fullscreen  ',
            'insertdatetime media table paste code wordcount'
          ],
          menubar: true,
          toolbar:
            'fullscreen | uploadImage | undo redo | formatselect  | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent ',
          content_style: '* { padding: 0; margin: 0; box-sizing: border-box; } body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          setup: (editor) => {
            editor.ui.registry.addButton('uploadImage', {
              text: 'Upload Image',
              onAction: () => setIsUploadImage(true)
            });
          }
        }}
      />
    </Box>
  );
}

export default RichTextEditor;
