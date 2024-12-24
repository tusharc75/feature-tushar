import MomentUtils from '@date-io/moment';
import { Box, Button, Grid, IconButton, Paper, TextField, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import MuiPickersUtilsProvider from '@material-ui/pickers/MuiPickersUtilsProvider';
import { CustomDialogTransition, imageUploadMaxSize } from 'src/constants/helpers';
import DeleteIcon from '@material-ui/icons/Delete';
import { GoArrowDown } from 'react-icons/go';
import { useContext, useEffect, useState } from 'react';
import emailStyles from '../../Activity/Email/email.module.scss';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import { Autocomplete } from '@mui/material';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import ImageAttachments from 'src/components/Activity/Email/ImageAttachments';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import TinyMce from '../../../components/TinyMCE';
import { fileIcons } from 'src/components/Activity/Email/FileIcons';
import AttachmentThumbnail from 'src/components/AttachmentThumbnail';

const AskSupplierPriceDialog = (props) => {
  const { setAskSupplierPriceDialog, askSupplierPriceDialog, handelAskPriceToSupplier, supplierContactData, from, handleReject, fields = [] } = props;

  const [otherAttachments, setOtherAttachments] = useState([]);
  const [fileImageAttachments, setFileImageAttachments] = useState([]);
  const [open, setOpen] = useState(false);
  const [imageSource, setImageSource] = useState(null);
  const [imageAttachments, setImageAttachments] = useState([]);
  const [contantValue, setContantValue] = useState(null);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [contactId, setContactId] = useState([]);
  const [selectedFields, setSelectedFields] = useState(
    fields
      ?.filter(
        (d) =>
          d.sectionName === 'Supplier Information' &&
          d.type === 'currencyAmount' &&
          (d.formula === undefined || d.formula === null || d.formula === '')
      )
      .map((d) => d?.fieldName)
  );

  const getFileIconSrc = (file) => {
    let extension = file.substring(file.lastIndexOf('.')).toLowerCase();
    let data = fileIcons.find((o) => o.extensions.indexOf(extension) >= 0);
    if (data && data?.source) return data.source;
  };

  const handleDeleteAttachment = (url) => {
    setOtherAttachments(otherAttachments.filter((currentUrl) => currentUrl !== url));
  };

  const handleDeleteImageAttachment = (url) => {
    setImageAttachments(imageAttachments.filter((currentUrl) => currentUrl !== url));
  };
  const handleDeleteFileImageAttachment = (url) => {
    setFileImageAttachments(fileImageAttachments.filter((currentUrl) => currentUrl !== url));
  };

  const checkImageUrl = (url) => {
    let extension = url.substring(url.lastIndexOf('.')).toLowerCase();
    let imageExtensions = ['.tif', '.tiff', '.bmp', '.jpg', '.jpeg', '.gif', '.png', '.eps', '.raw', '.cr2', '.nef', '.orf', '.sr2'];
    return imageExtensions.indexOf(extension) >= 0;
  };

  const onUploadFile = (file) => {
    if (checkImageUrl(file)) {
      setFileImageAttachments((prevState) => [...prevState, file]);
    } else {
      setOtherAttachments((prevState) => [...prevState, file]);
    }
  };

  const getImageUrl = (file) => {
    let formData = new FormData();
    formData.append('file', file);
    axiosInstance()
      .post('/user/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(({ data }) => {
        setImageAttachments((prevState) => [...prevState, data.fileUrl]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleUploadImage = (event) => {
    if (event.target.files && event.target.files.length) {
      const file = event.target.files[0];
      if (file.size > imageUploadMaxSize.size) {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: `Image must be less than ${imageUploadMaxSize.text} size`
        });
      } else {
        getImageUrl(file);
      }
    }
  };

  return (
    <>
      <Dialog
        maxWidth={'md'}
        fullWidth={true}
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={() => {
          setAskSupplierPriceDialog(false);
        }}
        open={askSupplierPriceDialog}
        disableBackdropClick={true}
        disableEnforceFocus={true}
      >
        <CustomDialogHeader
          title={from != 'SupplierAskPrice' ? 'Ask Supplier to Quote' : 'Reject Supplier Quote'}
          onClose={() => {
            setAskSupplierPriceDialog(false);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
          showRequiredLabel={false}
        />

        <CustomDialogContent>
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <Box padding={1}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  {from != 'SupplierAskPrice' && (
                    <Autocomplete
                      multiple
                      options={[{ _id: 'All', concatedName: 'All' }, ...supplierContactData]}
                      getOptionLabel={(option: any) =>
                        option
                          ? option?.accountName
                            ? `${option?.concatedName} - ${option?.accountName?.optionLabel}`
                            : `${option?.concatedName}`
                          : ''
                      }
                      value={
                        supplierContactData.filter((data) => contactId?.some((d) => d === data._id)).length
                          ? supplierContactData.filter((data) => contactId?.some((d) => d === data._id))
                          : []
                      }
                      onChange={(e, val: any) => {
                        val?.some((d) => d?._id === 'All')
                          ? setContactId(supplierContactData?.map((d) => d._id))
                          : setContactId(val && val?.map((d) => d._id));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" name="contact" label="Supplier Contact" variant="outlined" required fullWidth />
                      )}
                    />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    {otherAttachments && otherAttachments.length > 0 && (
                      <AttachmentThumbnail attachments={otherAttachments} canEdit={true} handleDeleteAttachment={handleDeleteAttachment} />
                    )}
                    {otherAttachments && otherAttachments.length > 0 && (
                      <ImageAttachments
                        imageAttachments={fileImageAttachments}
                        onImageClick={(attachment) => {
                          setImageSource(attachment);
                          setOpen(true);
                        }}
                        isCreateOnly={true}
                        onDelete={handleDeleteFileImageAttachment}
                        emailId={null}
                      />
                    )}
                    {otherAttachments && otherAttachments.length > 0 && (
                      <ImageAttachments
                        imageAttachments={imageAttachments}
                        onImageClick={(attachment) => {
                          setImageSource(attachment);
                          setOpen(true);
                        }}
                        isCreateOnly={true}
                        onDelete={handleDeleteImageAttachment}
                        emailId={null}
                      />
                    )}
                    <TinyMce
                      onChange={(value) => {
                        setContantValue(value);
                      }}
                      initialValue={''}
                      imageOrFileUploadCompletePercentage={(completePercentage) => {
                        setUploadingImageOrFileProgress(completePercentage);
                      }}
                      doNotShowUploadFile={false}
                      onUploadFile={onUploadFile}
                      onUploadImage={handleUploadImage}
                      usePublicUrlforFileUpload={true}
                      isSendToCustomer={false}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  {from != 'SupplierAskPrice' && (
                    <Autocomplete
                      multiple
                      options={[
                        { fieldName: 'All', fieldLabel: 'All' },
                        ...fields.filter(
                          (d) =>
                            d.sectionName === 'Supplier Information' &&
                            d.type === 'currencyAmount' &&
                            (d.formula === undefined || d.formula === null || d.formula === '')
                        )
                      ]}
                      getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
                      value={
                        fields.filter((data) => selectedFields?.some((d) => d === data?.fieldName)).length
                          ? fields.filter((data) => selectedFields?.some((d) => d === data?.fieldName))
                          : []
                      }
                      onChange={(e, val: any) => {
                        val?.some((d) => d?.fieldName === 'All')
                          ? setSelectedFields(
                              fields
                                ?.filter(
                                  (d) =>
                                    d.sectionName === 'Supplier Information' &&
                                    d.type === 'currencyAmount' &&
                                    (d.formula === undefined || d.formula === null || d.formula === '')
                                )
                                .map((d) => d?.fieldName)
                            )
                          : setSelectedFields(val && val?.map((d) => d?.fieldName));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} margin="dense" name="field" label="Required Field" variant="outlined" required fullWidth />
                      )}
                    />
                  )}
                </Grid>
              </Grid>
            </Box>
          </MuiPickersUtilsProvider>
        </CustomDialogContent>

        <CustomDialogFooter>
          <Button
            type="button"
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              setAskSupplierPriceDialog(false);
            }}
          >
            Cancel
          </Button>

          {from === 'SupplierAskPrice' ? (
            <CustomButton variant="contained" color="primary" onClick={() => handleReject(contantValue)}>
              Submit
            </CustomButton>
          ) : (
            <CustomButton
              variant="contained"
              color="primary"
              disabled={contactId.length === 0 || selectedFields.length === 0}
              onClick={() => handelAskPriceToSupplier(contantValue, contactId, selectedFields, otherAttachments)}
            >
              Send
            </CustomButton>
          )}
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};
export default AskSupplierPriceDialog;
