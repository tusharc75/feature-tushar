import { useState, useContext, Fragment } from 'react';
import { Box, Dialog, Button, Grid } from '@material-ui/core';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { isMobile, isTablet } from 'react-device-detect';
import {
  CustomDialogTransition,
  setFieldsInAscendingOrder,
} from '../../constants/helpers';
import { yupSchema } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import FormTypes from '../../components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import CustomButton from '../../components/Helpers/CustomButton';

const ManageChannel = ({ onClose, onSuccess }) => {
  const toastConfig = useContext(CustomToastContext);

  const fields = [
    {
      fieldLabel: "Title",
      fieldName: "title",
      isColumnEditable: true,
      type: 'singleLine',
      required: true,
      option: [],
      sectionName: 'Channel Information',
      order: 1,
    },
    {
      fieldLabel: "Description",
      fieldName: "description",
      isColumnEditable: true,
      type: 'singleLine',
      required: false,
      option: [],
      sectionName: 'Channel Information',
      order: 2,
    },
    {
      fieldLabel: "Access",
      fieldName: "access",
      isColumnEditable: true,
      type: 'dropDown',
      isDropdown: true,
      required: true,
      sectionName: 'Channel Information',
      option: [
        {
          optionLabel: 'Public',
          optionValue: 'public'
        },
        {
          optionLabel: 'Private',
          optionValue: 'private'
        }
      ],
      order: 3,
    }
  ];

  const [loading, setLoading] = useState(false);
  const initialData = { fields: fields, values: {} };
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);


  const handleSubmit = async (values) => {
    setSubmitting(true);
    let updatedValues = { ...values };

    await axiosInstance().post('/work-space/channel', updatedValues)
      .then(({ data }) => {
        setLoading(false);
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        onSuccess();
      })
      .catch((error) => {
        setLoading(false);
        setSubmitting(false);
        toastConfig.setToastConfig(error);
        onSuccess();
      });
  };


  const handleScroll = (errors) => {
    const err = Object.keys(errors);
    if (err.length) {
      const input = document.querySelector(`input[name=${err[0]}]`);
      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'start'
      });
    }
  };

  const formsData = setFieldsInAscendingOrder(initialData.fields);

  return (
    <Dialog
      maxWidth="md"
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
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (!isEqual(values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                title={`Create Channel`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {formsData &&
                    formsData?.map((form, i) => {
                      return form.name && (
                        <div key={i}>
                          <div className="detail-box-content">
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className="form-label-style form-label-quotes">{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  <FormTypes
                                    {...field}
                                    fieldData={field}
                                    fields={initialData.fields}
                                    values={values}
                                    errors={errors}
                                    touched={touched}
                                    label={field.fieldLabel}
                                    name={field.fieldName}
                                    type={field.type}
                                    options={field.option}
                                    setFieldValue={(name, value) => {
                                      setFieldValue(name, value);
                                    }}
                                    required={field.required}
                                    fullWidth
                                    isTooltip={field?.isTooltip || false}
                                    tooltipMessage={field?.tooltipMessage}
                                    size="small"
                                    imageOrFileUploadCompletePercentage={null}
                                  />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      )
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting || loading}
                  onClick={() => {
                    if (!isEqual(values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  disabled={isSubmitting || loading}
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    handleScroll(errors);
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

export default ManageChannel;
