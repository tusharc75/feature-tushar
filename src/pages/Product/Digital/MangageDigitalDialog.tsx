import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { CustomDialogTransition, getObjKeysWithValues, setFieldsInAscendingOrder, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isEqual } from 'lodash';

const MangageDigitalDialog = ({ open, onClose, digitalId = null, onSuccess, productId }) => {
  const fieldData = [
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: 'Title',
        type: 'singleLine',
        option: [],
        required: true,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 1,
        hiddenField: false,
        isDefaultValue: false,
        disableOnEdit: false,
        unique: true,
        lookup: false,
        lookupResource: '',
        entityWiseLookup: false,
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: '',
        fieldName: 'title',
        sectionName: 'Digital Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba18',
        fieldLabel: 'Type',
        required: true,
        type: 'radio',
        option: [
          {
            optionLabel: 'File',
            optionValue: 'File',
            order: 1,
            default: true
          },
          {
            optionLabel: 'Key',
            optionValue: 'Key',
            order: 2,
            default: false
          }
        ],
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 2,
        fieldName: 'type',
        sectionName: 'Digital Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '63a435bd2da3f42b9da6d26e',
        fieldLabel: 'Internal',
        type: 'checkBox',
        option: [],
        required: false,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 17,
        fieldName: 'internal',
        sectionName: 'Digital Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: 'Key',
        type: 'singleLine',
        option: [],
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 3,
        hiddenField: false,
        isDefaultValue: false,
        disableOnEdit: false,
        unique: true,
        required: true,
        lookup: false,
        lookupResource: '',
        entityWiseLookup: false,
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: '',
        fieldName: 'key',
        sectionName: 'Digital Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: 'Files',
        type: 'multiFileUpload',
        option: [],
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        required: true,
        order: 4,
        hiddenField: false,
        isDefaultValue: false,
        disableOnEdit: false,
        unique: true,
        lookup: false,
        lookupResource: '',
        entityWiseLookup: false,
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: '',
        fieldName: 'file',
        sectionName: 'Digital Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    }
  ];

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [formsData, setFormsData] = useState([]);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    var fieldsDataForCreate = fieldData?.map((d: any) => d.fieldData);
    if (digitalId) {
      axiosInstance()
        .get(`${routes.product.path}/${productId}/digital-product/${digitalId}`)
        .then(({ data }) => {
          setInitialData({
            fields: fieldsDataForCreate,
            values: getObjKeysWithValues(data.data, fieldsDataForCreate)
          });
          setFormsData(
            setFieldsInAscendingOrder(
              fieldsDataForCreate.filter((d) => (data?.data['type'] === 'key' ? d.fieldName !== 'file' : d.fieldName !== 'key'))
            )
          );
        })
        .catch((error) => {
          setLoading(false);
        });
    } else {
      setInitialData({
        fields: fieldsDataForCreate,
        values: getObjKeysWithValues({ type: 'key' }, fieldsDataForCreate)
      });
      setFormsData(setFieldsInAscendingOrder(fieldsDataForCreate.filter((d) => d.fieldName !== 'file')));
    }
  }, []);

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      initialData.fields.forEach((input) => {
        if (input.required || values[input.fieldName]) {
          setTouched(input.fieldName, true);
        }
      });
      setErrors({ ...errors });
    } else {
      handleSave(values);
    }
  };

  const handleSave = (data: any) => {
    if (digitalId) {
      data._id = digitalId;
      axiosInstance()
        .put(`${routes.product.path}/${productId}/digital-product`, data)
        .then(() => {
          onSuccess();
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`${routes.product.path}/${productId}/digital-product`, data)
        .then(() => {
          onSuccess();
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            setShowConfirmDialog(true);
          }
        }}
        open={open}
      >
        {initialData?.fields?.length ? (
          <Formik
            initialValues={initialData.values}
            validationSchema={yupSchema(initialData.fields)}
            validateOnMount
            // validate={validate}
            onSubmit={() => {}}
          >
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <Fragment>
                <CustomDialogHeader
                  title={digitalId ? 'Edit' : 'Add'}
                  onClose={(e, reason) => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                  isMinimized={!fullScreen}
                  onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                  }}
                  showManimizeMaximize={true}
                />
                <CustomDialogContent>
                  <Form>
                    {formsData &&
                      formsData.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
                              <div className={'detail-box-content'}>
                                <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                              </div>
                              <Box marginY={2}>
                                <Grid spacing={3} container>
                                  {form.sectionFields.map((field) => (
                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                      <FormTypes
                                        {...field}
                                        fieldData={field}
                                        disabled={field.disabled}
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
                                        isMultipleUpload={true}
                                        isTooltip={field?.isTooltip || false}
                                        tooltipMessage={field?.tooltipMessage}
                                        size="small"
                                        imageOrFileUploadCompletePercentage={
                                          ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                            ? (completePercentage) => {
                                                setUploadingImageOrFileProgress(completePercentage);
                                              }
                                            : null
                                        }
                                        row={true}
                                      />
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </div>
                          )
                        );
                      })}
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      if (isEqual(initialData.values, values)) onClose();
                      else setShowConfirmDialog(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={uploadingImageOrFileProgress > 0 || loading}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                    }}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);

                      handleSubmit(errors, setFieldTouched, values, setValues, setErrors);
                    }}
                    close={() => setShowConfirmDialog(false)}
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
    </>
  );
};

export default MangageDigitalDialog;
