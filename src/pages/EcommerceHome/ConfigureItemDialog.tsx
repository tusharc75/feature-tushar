import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { CustomDialogTransition } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ConfigureItemDialog = ({ open, onClose, itemData, setFormData }) => {
  const imageField: any = {
    _id: '62d103f69be8b23c5e3fba17',
    fieldLabel: itemData?.type?.includes('imageSlider') ? 'Images' : 'Image',
    type: itemData?.type?.includes('imageSlider') ? 'multiImageUpload' : 'imageUpload',
    option: [],
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    deletAble: true,
    order: 2,
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
  };

  const kpiValue = [
    {
      optionLabel: 'Deals of The Day',
      optionValue: 'dealsofTheDay'
    },
    {
      optionLabel: 'Popular Listings',
      optionValue: 'popularListings'
    },
    {
      optionLabel: 'Top Offers On',
      optionValue: 'topOffers'
    },
    {
      optionLabel: 'Inspired By your Browsing History',
      optionValue: 'browsingHistory'
    }
  ];

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [digitalData, setDigitalData] = useState(itemData);
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    setDigitalData(itemData);
  }, [itemData]);

  const handleSave = (data: any) => {
    setFormData((prevState) => {
      let tempData = prevState.filter((i) => (i._id ? i._id !== itemData?._id : i.type !== itemData?.type));
      return [...tempData, { ...itemData, ...data }];
    });
    onClose();
  };

  const validate = (values) => {
    const errors = {};
    if (!values?.column || values?.column === '') {
      errors['column'] = 'Required';
    }
    if ((!values?.title || values.title === '') && ['productCategory', 'menu'].includes(values?.type)) {
      errors['title'] = 'Title is required';
    }
    if (!values?.kpi && ['productList'].includes(values?.type)) {
      errors['kpi'] = 'KPI is required';
    }
    if (!values?.images && !values?.images?.length && ['imageSlider'].includes(values?.type)) {
      errors['multiImageUpload'] = 'Images are required';
    }
    if (!values?.image && !values?.image?.length && ['image'].includes(values?.type)) {
      errors['imageUpload'] = 'Image is required';
    }

    if (!values?.url && ['imageSlider', 'image'].includes(values?.type)) {
      errors['url'] = 'URL is Required';
    }
    if (!values?.detail && ['imageSlider', 'image'].includes(values?.type)) {
      errors['detail'] = 'Detail is Required';
    }

    return errors;
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
          onClose={onClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        {!digitalData ? (
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
          <Formik initialValues={digitalData} validateOnMount validate={validate} onSubmit={handleSave}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <>
                <CustomDialogContent>
                  <Form>
                    <Box marginY={2}>
                      <Grid spacing={3} container>
                        <Grid item xs={12} sm={6} md={6}>
                          <FormControl component="fieldset" required error={Boolean(errors['column'])}>
                            <FormLabel component="legend">Column</FormLabel>
                            <RadioGroup row name={'column'} value={values['column'] || ''} onChange={(e) => setFieldValue('column', e.target.value)}>
                              {['3', '6', '12'].map((opt) => (
                                <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </Grid>
                        {['menu', 'productCategory', 'productList'].includes(itemData.type) && (
                          <Grid item xs={12} sm={6} md={6}>
                            <TextField
                              variant="outlined"
                              type="text"
                              size="small"
                              fullWidth
                              label={'Title'}
                              required={true}
                              name={'title'}
                              value={values['title'] || ''}
                              error={Boolean(errors['title'])}
                              helperText={errors['title']}
                              onChange={(e) => setFieldValue('title', e.target.value.trimStart())}
                            />
                          </Grid>
                        )}
                        {['imageSlider', 'image'].includes(itemData?.type) && (
                          <>
                            <Grid item xs={12} sm={6} md={6}>
                              <FormTypes
                                fieldData={imageField}
                                values={values}
                                errors={errors}
                                touched={true}
                                label={imageField.fieldLabel}
                                name={imageField.fieldName}
                                type={imageField.type}
                                setFieldValue={(name, value) => {
                                  setFieldValue(name, value);
                                }}
                                required={imageField.required}
                                fullWidth
                                size="small"
                                imageOrFileUploadCompletePercentage={
                                  ['imageUpload', 'fileUpload'].some((s) => s === imageField.type)
                                    ? (completePercentage) => {
                                        setUploadingImageOrFileProgress(completePercentage);
                                      }
                                    : null
                                }
                                row={true}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                              <TextField
                                variant="outlined"
                                type="text"
                                size="small"
                                fullWidth
                                label={'Url'}
                                required={true}
                                name={'url'}
                                value={values['url'] || ''}
                                error={Boolean(errors['url'])}
                                helperText={errors['url']}
                                onChange={(e) => setFieldValue('url', e.target.value.trimStart())}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                              <TextField
                                variant="outlined"
                                type="text"
                                size="small"
                                fullWidth
                                label={'Detail'}
                                required={true}
                                name={'detail'}
                                value={values['detail'] || ''}
                                error={Boolean(errors['detail'])}
                                helperText={errors['detail']}
                                onChange={(e) => setFieldValue('detail', e.target.value.trimStart())}
                              />
                            </Grid>
                          </>
                        )}
                        {itemData.type === 'productList' && (
                          <Grid item xs={12} sm={6} md={6}>
                            <Autocomplete
                              options={kpiValue}
                              freeSolo
                              selectOnFocus
                              clearOnBlur
                              handleHomeEndKeys
                              forcePopupIcon={true}
                              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                              getOptionSelected={(option: any, val) => option.optionValue === val}
                              value={
                                kpiValue?.filter((v) => v.optionValue === values['kpi']).length
                                  ? kpiValue.filter((data) => data.optionValue === values['kpi'])[0]
                                  : '' || ''
                              }
                              onChange={(e, val) => {
                                setFieldValue('kpi', val?.optionValue || '');
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  label={'KPI'}
                                  required
                                  name={'kpi'}
                                  error={Boolean(errors['kpi'])}
                                  helperText={errors['kpi']}
                                />
                              )}
                            />
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <CustomButton
                    loading={loading}
                    variant="contained"
                    color="primary"
                    disabled={uploadingImageOrFileProgress > 0 || loading}
                    onClick={submitForm}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={submitForm}
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
