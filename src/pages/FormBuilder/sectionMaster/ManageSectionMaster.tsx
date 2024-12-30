import { Box, Dialog, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import IconAutoComplete from './IconAutoComplete';
import { defaultIcons } from 'src/assets/IconGenerator';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const ManageSectionMaster = ({ onClose, onSuccess, sectionData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [initialData] = useState({
    sectionName: sectionData?.sectionName || '',
    description: sectionData?.description || '',
    iconName: sectionData?.iconName ? sectionData?.iconName : defaultIcons.includes(sectionData?.sectionName || '') ? sectionData?.sectionName : ''
  });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSubmit = (values) => {
    setSubmitting(true);
    if (sectionData && sectionData?._id) {
      values._id = sectionData?._id;
    }
    values.oldSectionName = sectionData?.sectionName;
    axiosInstance()
      .put(`section-master`, values)
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  function validate(values) {
    const errors = {};
    if (!values?.sectionName) {
      errors['sectionName'] = 'Please enter section name';
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      {initialData ? (
        <Formik initialValues={initialData} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={sectionData ? `Edit Section` : 'Create Section'}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Grid container spacing={2}>
                    <Grid size={{xs:12, sm:12}}>
                      <TextField
                        margin="dense"
                        size="small"
                        type="text"
                        label="Section Name"
                        name="sectionName"
                        placeholder="Section Name"
                        fullWidth
                        required
                        onChange={(e) => setFieldValue('sectionName', e.target.value)}
                        variant="outlined"
                        value={values['sectionName']}
                        error={touched['sectionName'] && Boolean(errors['sectionName'])}
                        helperText={touched['sectionName'] && errors['sectionName']}
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:12}}>
                      <TextField
                        margin="dense"
                        size="small"
                        type="text"
                        label="Description"
                        name="description"
                        placeholder="Description"
                        fullWidth
                        multiline
                        rows={4}
                        onChange={(e) => setFieldValue('description', e.target.value)}
                        variant="outlined"
                        value={values['description']}
                      />
                    </Grid>
                    <Grid size={{xs:12}}>
                      <IconAutoComplete
                        onChange={(e, val) => {
                          setFieldValue('iconName', val);
                        }}
                        value={values['iconName']}
                      />
                    </Grid>
                  </Grid>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  onClick={() => {
                    if (isEqual(initialData, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  buttonType='transparent'
                >
                  Cancel
                </ThemeButton>
                <ThemeButton
                  onClick={submitForm}
                  disabled={submitting}
                  isLoading={submitting}
                  buttonType='theme'
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default ManageSectionMaster;
