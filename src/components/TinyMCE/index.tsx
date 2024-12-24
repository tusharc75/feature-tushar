import React, { useRef, Fragment, useState, useContext, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import axiosInstance from '../../axios/axiosInstance';
import { IconButton, Box, Button, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import CustomDialogHeader from '../CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../CustomDialog/CustomDialogFooter';
import { CustomDialogTransition, imageUploadMaxSize, documentUploadMaxSize } from '../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { AiOutlineFileAdd, AiOutlineClose } from 'react-icons/ai';
import { makeStyles } from '@mui/styles';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import ExpandMore from '@mui/icons-material/ExpandMore';
// import 'tinymce/icons/default';
import './tinymce.scss';

import { startCase } from 'lodash';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useAppTheme } from 'src/constants/AppConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1
  },
  errorText: {
    color: theme.palette.error.main
  },
  buttonContainer: {
    display: 'flex',
    padding: '5px',
    paddingLeft: '5px',
    borderBottom: '1px solid var(--common-border-color)'
  },
  varibalesButton: {
    margin: '0 5px'
  }
}));

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

export default function TinyMCE(props) {
  const { isOffline } = useContext(CustomOfflineContext);
  const [themeColor] = useAppTheme();

  const {
    onChange,
    initialValue,
    imageOrFileUploadCompletePercentage,
    height = 400,
    width = '',
    fileUploadMaxSize = { ...documentUploadMaxSize },
    onUploadFile = null,
    onUploadImage = null,
    usePublicUrlforFileUpload = false,
    doNotShowUploadFile = false,
    showVariableDropdown = false,
    id,
    isCheckHeight = false,
    disabledEditor = false,
    isSendToCustomer = false,
    onQuoteUpload = null,
    variables = null
  } = props;

  const classes = useStyles();
  const [prevData, setPrevData] = useState('');
  const [imageDetails, setImageDetails] = useState({ width: 0, height: 0, alt: '' });
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [isUploadImage, setIsUploadImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isInitiated, setIsInitiated] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = React.useState(0);
  const [isImgUploading, setImgUploading] = React.useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { setToastConfig } = useContext(CustomToastContext);

  const editorRef = useRef(null);

  useEffect(() => {
    if (id && ['header', 'footer'].indexOf(id) >= 0) {
      setImageDetails({ width: 0, height: 60, alt: '' });
    }
  }, []);

  const handleUploadFile = async (ev) => {
    if (ev.target.files && ev.target.files.length) {
      let files = ev.target.files;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > fileUploadMaxSize.size) {
          setToastConfig({
            open: true,
            type: 'error',
            message: `file must be less than ${fileUploadMaxSize.text} size`
          });
          break;
        }
        if (isSendToCustomer) {
          let base64String = '';
          base64String = (await toBase64(file)) + '';
          base64String = base64String.substring(base64String.indexOf('base64,') + 7, base64String.length);
          let name = file.name;
          let type = file.type;
          let lastIndex = name.lastIndexOf('.');
          let ext = name.substring(lastIndex);
          onQuoteUpload({ name: name.substring(0, lastIndex), extension: ext, contentType: type, base64: base64String });
        } else {
          getFileUrl(file, '', {});
        }
      }
      ev.target.value = '';
    }
  };
  const getFileUrl = (file, api, details) => {
    setImageUploadProgress(0);
    let formData = new FormData();
    formData.append('file', file);
    let uploadUrl = api ? api : usePublicUrlforFileUpload ? '/user/upload-public' : '/doc-parser';
    setImgUploading(true);
    if (imageOrFileUploadCompletePercentage) {
      imageOrFileUploadCompletePercentage(1);
    }
    axiosInstance()
      .post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pE) => {
          const completedPercent = Math.floor((pE.loaded * 100) / pE.total);
          setImageUploadProgress(completedPercent);
          if (imageOrFileUploadCompletePercentage) {
            imageOrFileUploadCompletePercentage(completedPercent);
          }
          if (completedPercent === 100) {
            setTimeout(() => {
              setImageUploadProgress(0);
              if (imageOrFileUploadCompletePercentage) {
                imageOrFileUploadCompletePercentage(0);
              }
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
          if (onUploadFile) {
            onUploadFile(data.fileUrl);
          } else {
            if (isCheckHeight) {
              if (isValidHeight()) {
                editorRef.current.execCommand('mceInsertContent', false, data);
              }
            } else editorRef.current.execCommand('mceInsertContent', false, data);
          }
        }
        //data.fileUrl data.fileName
      })
      .catch((err) => {
        setImgUploading(false);
        setToastConfig(err);
        setImageUploadProgress(0);
        if (imageOrFileUploadCompletePercentage) {
          imageOrFileUploadCompletePercentage(0);
        }
      });
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

  const getImageUrl1 = (file) => {
    let formData = new FormData();
    formData.append('file', file);
    setIsImageLoading(true);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        setIsImageLoading(false);
        setUploadError(false);
        setImageUrl(data.fileUrl);
      })
      .catch((err) => setIsImageLoading(false));
  };

  const isValidHeight = () => {
    return true;
    // const contentDiv = document.getElementById('contentDiv');
    // let content = editorRef.current.getContent();
    // contentDiv.innerHTML = content;
    // let contentHeight = contentDiv.offsetHeight;
    // let validHeight = height ? height / 2.5 : 106;

    // if (contentHeight < validHeight) {
    //   setPrevData(content);
    //   contentDiv.innerHTML = '';
    //   return true;
    // } else {
    //   editorRef.current.setContent(prevData);
    //   contentDiv.innerHTML = '';
    //   return false;
    // }
  };

  const handleSubmit = () => {
    if (!imageUrl) {
      setUploadError(true);
      return;
    }
    let imgTag = `<img style="max-width:100%;" src='${imageUrl}'`;
    if (imageDetails && imageDetails.width) {
      imgTag = `${imgTag} width='${imageDetails.width}'`;
    }
    if (imageDetails && imageDetails.height) {
      imgTag = `${imgTag} height='${imageDetails.height}'`;
    } else if (isCheckHeight) {
      imgTag = `${imgTag} height='${60}'`;
    }

    if (imageDetails && imageDetails.alt) {
      imgTag = `${imgTag} alt='${imageDetails.alt}'`;
    }
    imgTag = `${imgTag} />`;

    if (isCheckHeight) {
      if (isValidHeight()) {
        editorRef.current.execCommand('mceInsertContent', false, imgTag);
      }
    } else editorRef.current.execCommand('mceInsertContent', false, imgTag);

    setIsUploadImage(false);
    setImageUrl('');
    let tempHeight = id && ['header', 'footer'].indexOf(id) >= 0 ? 60 : 0;
    setImageDetails({ width: 0, height: tempHeight, alt: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setImageDetails((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleVaribleSelect = (e) => {
    let newTag = `<p>{{${e}}}</p>`;
    if (isCheckHeight) {
      if (isValidHeight()) {
        editorRef.current.execCommand('mceInsertContent', false, newTag);
      }
    } else editorRef.current.execCommand('mceInsertContent', false, newTag);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <div style={{ border: '1px solid var(--common-border-color)' }}>
      {isOffline ? (
        <div style={{ width: width }}>
          <div
            style={{ height: 175, overflow: 'auto', width: '100%', textAlign: 'left' }}
            className="border-radius-1 border p-2"
            dangerouslySetInnerHTML={{ __html: initialValue || '' }}
          ></div>
        </div>
      ) : (
        <>
          {disabledEditor ? (
            ''
          ) : (
            <>
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
                                disabled={disabledEditor || isImageLoading}
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
                        let tempHeight = id && ['header', 'footer'].indexOf(id) >= 0 ? 60 : 0;
                        setImageDetails({ width: 0, height: tempHeight, alt: '' });
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
              {isInitiated ? (
                <div style={{ width: width }} className={classes.buttonContainer}>
                  {doNotShowUploadFile ? null : (
                    <Fragment>
                      <Box display="flex" alignItems="center" style={{ marginRight: '5px' }}>
                        <input
                          id={`${id}file`}
                          name={`${id}file`}
                          onChange={handleUploadFile}
                          style={{ display: 'none' }}
                          onClick={(e: any) => (e.target.value = null)}
                          type="file"
                          accept=".docx,.doc"
                        />
                        <label htmlFor={`${id}file`}>
                          <Button
                            size="small"
                            variant="outlined"
                            component="span"
                            disabled={disabledEditor || isImgUploading}
                            startIcon={<AiOutlineFileAdd />}
                          >
                            Upload File
                          </Button>
                        </label>
                      </Box>
                    </Fragment>
                  )}
                  <span>
                    <Box display="flex" alignItems="center">
                      <Button
                        startIcon={<HiOutlinePhotograph />}
                        size="small"
                        variant="outlined"
                        disabled={disabledEditor}
                        onClick={() => setIsUploadImage(true)}
                      >
                        Upload Image
                      </Button>
                    </Box>
                  </span>
                  <span>
                    {showVariableDropdown ? (
                      <>
                        <Button
                          variant="outlined"
                          color="default"
                          size="small"
                          onClick={openActions}
                          className={classes.varibalesButton}
                          aria-controls="action-menu"
                        >
                          Variables <ExpandMore />
                        </Button>
                        <Menu
                          anchorEl={anchorEl}
                          keepMounted
                          getContentAnchorEl={null}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left'
                          }}
                          id="action-menu"
                          open={Boolean(anchorEl)}
                          onClose={closeActions}
                        >
                          {variables &&
                            variables.map((o) => {
                              return (
                                <MenuItem onClick={() => handleVaribleSelect(o)} value={o}>
                                  {o === 'pDFTemplate' ? 'PDF Template' : startCase(o)}
                                </MenuItem>
                              );
                            })}
                        </Menu>
                      </>
                    ) : null}
                  </span>
                </div>
              ) : null}
            </>
          )}
          <div style={{ width: width }} key={themeColor}>
            <Editor
              disabled={disabledEditor}
              id={id ?? 'editor'}
              onInit={(evt, editor) => {
                setIsInitiated(true);
                editorRef.current = editor;
              }}
              initialValue={initialValue || ''}
              onChange={(content) => {
                if (editorRef.current.isDirty()) {
                  if (isCheckHeight) {
                    if (isValidHeight()) {
                      onChange(editorRef.current.getContent());
                    } else {
                      setToastConfig({
                        open: true,
                        type: 'error',
                        message: `${id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Editor'} height is restricted so you cannot add more content`
                      });
                    }
                  } else onChange(editorRef.current.getContent());
                }
              }}
              init={{
                height: height,
                width: '100%',
                // menubar: false,
                table_default_attributes: {
                  border: '0'
                },
                block_formats: 'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3',
                font_formats: 'Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n',
                plugins: [
                  'advlist autolink lists link charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code wordcount hr'
                ],
                toolbar:
                  'undo redo | formatselect  | ' +
                  'bold italic backcolor | alignleft aligncenter ' +
                  'alignright alignjustify | bullist numlist outdent indent ',
                content_style: '* { padding: 0; margin: 0; box-sizing: border-box; } body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                skin: themeColor === 'dark' ? 'oxide-dark' : 'oxide',
                content_css: themeColor === 'dark' ? 'dark' : 'default'
              }}
            />
          </div>
          <div style={{ visibility: 'hidden' }} id="contentDiv"></div>
        </>
      )}
    </div>
  );
}
