import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import {
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  isFieldNotTouched,
  setFieldsInAscendingOrder,
  yupSchema
} from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { Skeleton } from '@material-ui/lab';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ConfigureItemDialog = ({ open, onClose, itemData, setFormData }) => {
  const fieldData = [
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: 'URL',
        type: 'singleLine',
        option: [],
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
        fieldName: 'url',
        sectionName: 'Image Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e1fba17',
        fieldLabel: 'Title',
        type: 'singleLine',
        option: [],
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
        sectionName: 'Image Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba111',
        fieldLabel: 'Detail',
        type: 'multiLine',
        option: [],
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
        fieldName: 'detail',
        sectionName: 'Image Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '631599890d0b6e3f87381b8a',
        fieldLabel: 'KPI',
        type: 'dropDown',
        option: [
          {
            optionLabel: 'Deals of The Day',
            optionValue: 'dealsofTheDay',
            order: 1,
            default: false
          },
          {
            optionLabel: 'Popular Listings',
            optionValue: 'popularListings',
            order: 2,
            default: false
          },
          {
            optionLabel: 'Top Offers On',
            optionValue: 'topOffers',
            order: 3,
            default: false
          },
          {
            optionLabel: 'Inspired By your Browsing History',
            optionValue: 'browsingHistory',
            order: 4,
            default: false
          }
        ],
        required: true,
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        hiddenField: false,
        isDefaultValue: false,
        disableOnEdit: false,
        addManualOptionInExcel: false,
        addAdditionalOption: false,
        lookup: false,
        lookupResource: '',
        isDropdown: false,
        isWarningTooltip: false,
        warningTooltipMessage: '',
        defaultValue: '',
        sectionName: 'Image Information',
        fieldName: 'kpi',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba18',
        fieldLabel: 'Column ',
        type: 'radio',
        option: [
          {
            optionLabel: '3',
            optionValue: '3',
            order: 1,
            default: true
          },
          {
            optionLabel: '6',
            optionValue: '6',
            order: 2,
            default: false
          },
          {
            optionLabel: '12',
            optionValue: '12',
            order: 3,
            default: false
          }
        ],
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
        order: 2,
        fieldName: 'column',
        sectionName: 'Image Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '62d103f69be8b23c5e3fba17',
        fieldLabel: itemData?.type?.includes('imageSlider') ? 'Images' : 'Image',
        type: itemData?.type?.includes('imageSlider') ? 'multiImageUpload' : 'imageUpload',
        option: [],
        isTooltip: false,
        tooltipMessage: '',
        editAble: true,
        deletAble: true,
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
        fieldName: itemData?.type?.includes('imageSlider') ? 'images' : 'image',
        sectionName: 'Image Information',
        resource: 'Product'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    }
  ];

  const imageFields = ['column', 'url', 'images', 'image'];
  const productCategoryFields = ['column', 'title'];
  const productListFields = ['column', 'title', 'kpi'];
  const menuFields = ['column', 'title'];
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [digitalData, setDigitalData] = useState({ fields: [], initialValues: {} });
  const [formsData, setFormsData] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    var fieldsDataForCreate = itemData?.type?.includes('image')
      ? fieldData?.filter((d) => imageFields.includes(d.fieldData.fieldName)).map((d: any) => d.fieldData)
      : itemData?.type?.includes('productCategory')
      ? fieldData?.filter((d) => productCategoryFields.includes(d.fieldData.fieldName)).map((d: any) => d.fieldData)
      : itemData?.type?.includes('productList')
      ? fieldData?.filter((d) => productListFields.includes(d.fieldData.fieldName)).map((d: any) => d.fieldData)
      : itemData?.type?.includes('menu')
      ? fieldData?.filter((d) => menuFields.includes(d.fieldData.fieldName)).map((d: any) => d.fieldData)
      : [];
    setDigitalData({
      fields: fieldsDataForCreate,
      initialValues: getObjKeysWithValues(itemData, fieldsDataForCreate)
    });
    setFormsData(setFieldsInAscendingOrder(fieldsDataForCreate));
  }, []);

  const handleSubmit = async (errors, setTouched, values, setValues, setErrors) => {
    if (Object.keys(errors).length) {
      digitalData.fields.forEach((input) => {
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
    setFormData((prevState) => {
      let tempData = prevState.filter((i) => (i._id ? i._id !== itemData?._id : i.type !== itemData?.type));
      return [...tempData, { ...itemData, ...data }];
    });
    onClose();
  };

  const handleValuesChange = (data) => {
    setFormValues((prevState) => ({
      ...prevState,
      ...data
    }));
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
        <CustomDialogHeader
          title={`Edit ${itemData?.label || ''}`}
          onClose={(e, reason) => {
            if (isFieldNotTouched(digitalData, formValues)) onClose();
            else setShowConfirmDialog(true);
          }}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        {!digitalData.fields.length ? (
          <>
            <CustomDialogContent>
              <Skeleton width="100%" height="70px" />
              <Grid container spacing={2}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                  <Grid key={i} item xs={12} sm={6} md={6}>
                    <Skeleton width="100%" height="60px" />
                  </Grid>
                ))}
              </Grid>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button variant="outlined" size="small" color="primary" disabled>
                Cancel
              </Button>
              <Button variant="contained" size="small" color="primary" disabled>
                Submit
              </Button>
            </CustomDialogFooter>
          </>
        ) : (
          <Formik
            initialValues={digitalData.initialValues}
            validationSchema={yupSchema(digitalData.fields)}
            validateOnMount
            // validate={validate}
            onSubmit={() => {}}
          >
            {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    {formsData &&
                      formsData.map((form, i) => {
                        return (
                          form.name && (
                            <div key={i}>
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
                                          handleValuesChange({ [name]: value });
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
                      if (isFieldNotTouched(digitalData, values)) onClose();
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
                      if (values['type'] === 'key') {
                        delete errors['file'];
                      } else {
                        delete errors['key'];
                      }
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
              </>
            )}
          </Formik>
        )}
      </Dialog>
    </>
  );
};

export default ConfigureItemDialog;
