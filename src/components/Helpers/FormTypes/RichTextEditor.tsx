import React, { useContext, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Box, CircularProgress, Dialog, IconButton, TextField, Theme, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { HiOutlinePhotograph } from 'react-icons/hi';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, imageUploadMaxSize, termsAndConditionDocumentUploadMaxSize } from 'src/constants/helpers';
import { AiOutlineClose } from 'react-icons/ai';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { useAppTheme } from 'src/constants/AppConfig';

const useStyles = makeStyles((theme: Theme) => ({
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
    border: '1px solid var(--common-border-color)',
    borderBottom: '0'
  },
  varibalesButton: {
    margin: '0 5px'
  }
}));

function RichTextEditor({ value, label, name, setFieldValue }) {
  const editorRef = useRef(null);
  const [themeColor] = useAppTheme();
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

  const fileInputRef = useRef(null);

  const handleUploadFileClick = (e) => {
    // Trigger the file input click event when the "Upload File" button is clicked
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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

  const handleUploadFile = async (ev) => {
    setToastConfig({
      open: true,
      type: 'info',
      message: `Document upload in progress..`
    });
    if (ev.target.files && ev.target.files.length) {
      let files = ev.target.files;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > termsAndConditionDocumentUploadMaxSize.size) {
          setToastConfig({
            open: true,
            type: 'error',
            message: `file must be less than ${termsAndConditionDocumentUploadMaxSize.text} size`
          });
          break;
        }

        getFileUrl(file, '', {});
      }
      ev.target.value = '';
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
          setToastConfig({
            open: true,
            type: 'success',
            message: `Document upload completed`
          });
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
          onClose={(event, reason) => {
            if (reason !== 'backdropClick') {
              setIsUploadImage(false);
            }
          }}
          open={true}
          fullScreen={isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          maxWidth="xs"
        >
          <CustomDialogHeader onClose={() => setIsUploadImage(false)} title="Upload Image"></CustomDialogHeader>

          <CustomDialogContent>
            <div>
              <Grid container spacing={3}>
                <Grid size={{xs:12}} style={{ display: 'flex' }}>
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
                      <ThemeButton
                        startIcon={<HiOutlinePhotograph />}
                        buttonType='transparent'
                        disabled={isImageLoading}
                      >
                        Upload Image
                      </ThemeButton>
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
                  <Grid container>
                    {imageUrl ? (
                      <>
                        <Grid size={{xs:10}}>
                          <Typography noWrap variant="body2">
                            {imageUrl.substring(imageUrl.lastIndexOf('/') + 1)}
                          </Typography>
                        </Grid>
                        <Grid size={{xs:2}}>
                          <ThemeButton buttonType='transparent'
 startIcon={<AiOutlineClose />} onClick={() => setImageUrl('')} />
                        </Grid>
                      </>
                    ) : null}

                    {uploadError ? (
                      <Grid size={{xs:12}}>
                        <Typography className={classes.errorText}>Please Upload Image/Photo</Typography>
                      </Grid>
                    ) : null}
                  </Grid>
                ) : null}
                <Grid size={{xs:6}}>
                  <TextField id="width" type="number" name="width" size="small" label="Width" variant="outlined" onChange={handleChange} />
                </Grid>
                <Grid size={{xs:6}}>
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
                <Grid size={{xs:12}}>
                  <TextField id="alt" name="Alternative Text" size="small" label="alt" fullWidth variant="outlined" onChange={handleChange} />
                </Grid>
              </Grid>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            <ThemeButton
              buttonType="transparent"
              onClick={() => {
                setImageDetails({ width: 0, height: 60, alt: '' });
                setImageUrl('');
                setIsUploadImage(false);
              }}
            >
              Cancel
            </ThemeButton>
            <ThemeButton buttonType="theme" onClick={handleSubmit}>
              Save
            </ThemeButton>
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
            'insertdatetime media table paste code wordcount hr'
          ],
          menubar: true,
          toolbar:
            'fullscreen | uploadImage | uploadDocument | undo redo | formatselect  | ' +
            'bold italic backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent ',
          content_style: '* { padding: 0; margin: 0; box-sizing: border-box; } body { font-family:Poppins, sans-serif; font-size:14px }',
          setup: (editor) => {
            editor.ui.registry.addButton('uploadImage', {
              text: 'Upload Image',
              onAction: () => setIsUploadImage(true)
            });
            editor.ui.registry.addButton('uploadDocument', {
              text: 'Upload Document',
              onAction: (e) => handleUploadFileClick(e)
            });
          },

          skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
          content_css: themeColor === 'dark' ? 'dark' : 'default'
        }}
      />

      <input
        id={`file`}
        name={`file`}
        onChange={handleUploadFile}
        ref={fileInputRef}
        style={{ display: 'none' }}
        onClick={(e: any) => (e.target.value = null)}
        type="file"
        accept=".docx,.doc"
      />
    </Box>
  );
}

export default RichTextEditor;
