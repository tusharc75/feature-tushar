import React, { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@mui/material';
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
import InputField from 'src/components/Helpers/InputField';

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
        required: false,
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
        required: false,
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
        })
        .catch((error) => {
          setLoading(false);
        });
    } else {
      setInitialData({
        fields: fieldsDataForCreate,
        values: getObjKeysWithValues({ type: 'key' }, fieldsDataForCreate)
      });
    }
  }, []);

  const validate = (values) => {
    const errors = {};

    initialData.fields
      ?.filter((field) => field?.fieldData?.required)
      ?.forEach((input) => {
        if (!values[input?.fieldName]) {
          errors[input?.fieldName] = `${input?.fieldLabel} is required`;
        }
      });

    if (values?.type === 'Key' && !values?.key) {
      errors['key'] = 'Key is required';
    }
    if (values?.type === 'File' && values?.file?.length <= 0) {
      errors['file'] = 'File is required';
    }

    return errors;
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
            validate={validate}
            validateOnMount
            onSubmit={handleSave}
          >
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Fragment>
                <CustomDialogHeader
                  title={digitalId ? 'Edit' : 'Add'}
                  onClose={() => {
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
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={setFieldValue}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                    />
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
                    disabled={loading}
                    onClick={(e) => {
                      e.preventDefault();
                      submitForm();
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
                      submitForm();
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
