import { Fragment, useContext, useEffect, useState } from 'react';
import { Dialog, Button, Grid, Box, InputAdornment } from '@material-ui/core';
import { Formik, Form } from 'formik';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import { useHistory } from 'react-router-dom';
import {
  getObjKeys,
  yupSchema,
  setFieldsInAscendingOrder,
  getObjKeysWithValues,
} from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { FaDiceOne } from 'react-icons/fa';
import routes from 'src/components/Helpers/Routes';
import { isEqual } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
interface InitialData {
  fields: any[];
  values: object;
}

const CreateProjectSales = ({
  isClone = false,
  open,
  close,
  fetchData,
  type = null,
  projectSalesId = null,
  fields = null,
  onSuccess = null,
  accountId = null,
  resource = null
}) => {
  const {
    state: {
      user: { user },
      permissions
    }
  } = useData();
  const toastConfig = useContext(CustomToastContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<InitialData>({
    fields: [],
    values: {}
  });
  const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
  const history = useHistory();
  const [formsData, setFormsData] = useState([]);

  const [productSalesName, setProductSalesName] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (initialData.fields.length > 0) {
      setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }
  }, [initialData.fields]);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    axiosInstance().get('/field?resource=Project Sales').then(({ data: { data } }) => {

      const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
      const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

      if (projectSalesId) {
        axiosInstance().get(`${routes.projectSales.path}/${projectSalesId}`).then(({ data: { data } }) => {
          if (isClone) {
            const { projectName, ...rest } = data;
            let tempData = { ...rest };
            let tempObjKeysWithValues = getObjKeysWithValues(tempData, fieldsDataForUpdate);
            if (fieldsDataForUpdate?.some((e) => e.fieldName === 'projectManager')) {
              tempObjKeysWithValues['projectManager'] = user._id;
            }
            setInitialData({
              fields: fieldsDataForUpdate,
              values: tempObjKeysWithValues
            });
          } else {
            setInitialData({
              fields: fieldsDataForUpdate,
              values: getObjKeysWithValues(data, fieldsDataForUpdate)
            });
          }
          setProductSalesName(data.projectName);
        })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      } else {
        let tempObjKeysWithValues = getObjKeys('', fieldsDataForCreate);
        if (fieldsDataForCreate.some((e) => e.fieldName === 'currency')) {
          tempObjKeysWithValues['currency'] = user?.brandCurrency;
        }
        if (fieldsDataForCreate?.some((e) => e.fieldName === 'projectManager')) {
          tempObjKeysWithValues['projectManager'] = user._id;
        }
        setInitialData({
          fields: fieldsDataForCreate,
          values: tempObjKeysWithValues
        });
      }
    })
      .catch((err) => {
      });
  };

  const handleSubmit = (values) => {
    if (projectSalesId && !isClone) {
      setSubmitting(true);
      axiosInstance()
        .put(`${routes.projectSales.path}`, { ...values, _id: projectSalesId })
        .then(({ data }) => {
          fetchData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setSubmitting(false);
          close();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    } else {
      setSubmitting(true);
      var tempStaticData = {};
      if (type) {
        type.map((d: any) => {
          tempStaticData[d.type] = [d.id];
        });
      }
      tempStaticData['user'] = [values?.projectManager, user._id];
      values.staticData = tempStaticData;
      axiosInstance()
        .post(`${routes.projectSales.path}`, values)
        .then(({ data }) => {
          if (accountId) {
            axiosInstance().put(`${routes.projectSales.path}/add-customer-account`, {
              _id: data?.data._id,
              customerAccount: [accountId]
            });
          }
          if (onSuccess) {
            onSuccess(data);
          }
          const newId = data.data?._id;
          setSubmitting(false);
          fetchData();
          if (type) {
            close();
          } else {
            history.push(`${routes.projectSalesDetail.path}/${newId}`, {
              managerId: data.data?.projectManager
            });
            close();
          }
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setSubmitting(false);
        });
    }
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

  function validate(values) {
    const errors = {};
    return errors;
  }

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      {initialData?.fields?.length ? (
        <Formik
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          onSubmit={handleSubmit}
          validateOnMount
          validate={validate}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) {
                    close();
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
                title={`${isClone ? `Clone - ${productSalesName}` : projectSalesId ? `Update ${productSalesName}` : `New ${routes.projectSales.title}`
                  }`}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form noValidate>
                  {formsData &&
                    formsData.map((form, index1) => {
                      return form.name ? (
                        <div key={index1}>
                          <div className={'detail-box-content'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                          </div>
                          <Box marginY={2}>
                            <Grid spacing={3} container>
                              {form.sectionFields.map((field, index2) => (
                                <Grid key={index2} item xs={12} sm={6} md={6}>
                                  {field.fieldName === 'projectCategory' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
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
                                  ) : field.fieldName === 'startDate' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      maxDate={values.endDate}
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
                                  ) : field.fieldName === 'endDate' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      minDate={values.startDate}
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
                                  ) : field.fieldName === 'entity' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && !isClone && field.disableOnEdit}
                                      multiple
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value ? value.filter((v) => v.optionValue).map((val) => val.optionValue) : []);
                                        if (initialData?.fields?.some((e) => e.fieldName === 'projectManager')) {
                                          setFieldValue('projectManager', '');
                                        }
                                      }}
                                    />
                                  ) : field.fieldName === 'projectManager' ? (
                                    <FormTypes
                                      {...field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={
                                        values['entity'] && values['entity'].length
                                          ? field.option.filter((data) => values['entity']?.some((d) => data.entities?.some((e) => e.entity === d)))
                                          : field.option
                                      }
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      onChange={(e, value) => {
                                        setFieldValue(field.fieldName, value && value.optionValue ? value.optionValue : '');
                                      }}
                                    />
                                  ) : field.fieldName === 'currency' ? (
                                    <FormTypes
                                      {...field}
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
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
                                      onChange={(e, val) => {
                                        if (val && val.currencyCode) {
                                          setFieldValue(field.fieldName, val.currencyCode);
                                          setCurrencySymbol(val.symbolNative);
                                        } else {
                                          setFieldValue(field.fieldName, '');
                                          setCurrencySymbol(null);
                                        }
                                      }}
                                    />
                                  ) : field.fieldName.trim() === 'amount' ? (
                                    <FormTypes
                                      disabled={Boolean(projectSalesId) && field.disableOnEdit}
                                      isNew={Boolean(projectSalesId)}
                                      fieldId={field._id}
                                      lookup={field.lookup}
                                      // {...rest}
                                      selectedCurrencyCode={values['currency']}
                                      startAdornment={currencySymbol ? <InputAdornment position="start">{currencySymbol}</InputAdornment> : ''}
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
                                    />
                                  ) : (
                                    <FormTypes
                                      {...field}
                                      isNew={Boolean(projectSalesId)}
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
                                      disabled={(projectSalesId && field.fieldName === 'projectManager') || (!projectSalesId && field.disableOnEdit)}
                                    />
                                  )}
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </div>
                      ) : (
                        form.sectionFields.map((field) => (
                          <FormTypes
                            {...field}
                            disabled={Boolean(projectSalesId) && field.disableOnEdit}
                            isNew={Boolean(projectSalesId)}
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
                            style={{ visibility: 'hidden' }}
                          />
                        ))
                      );
                    })}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) {
                      close();
                    } else {
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  Cancel
                </Button>
                <CustomButton
                  loading={isSubmitting}
                  variant="contained"
                  color="primary"
                  disabled={uploadingImageOrFileProgress > 0}
                  onClick={(e) => {
                    e.preventDefault();
                    handleScroll(errors);
                    submitForm();
                  }}
                >
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    close();
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

export default CreateProjectSales;
