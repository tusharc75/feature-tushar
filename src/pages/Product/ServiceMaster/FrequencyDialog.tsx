import { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, IconButton, TextField } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { getObjKeysWithValues, serviceMaster, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { FieldArray, Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import InputField from 'src/components/Helpers/InputField';
import { Autocomplete } from '@material-ui/lab';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const OPERATOR = [
  {
    optionLabel: 'Less than',
    optionValue: 'lessThan'
  },
  {
    optionLabel: 'Less than or equals',
    optionValue: 'lessThanOrEquals'
  },
  {
    optionLabel: 'Equal to',
    optionValue: 'equalTo'
  },
  {
    optionLabel: 'Greater than',
    optionValue: 'greaterThan'
  },
  {
    optionLabel: 'Greater than or equals',
    optionValue: 'greaterThanOrEquals'
  }
];

const FrequencyDialog = ({ onClose, onSuccess, serviceData, productId }) => {
  const toastConfig = useContext(CustomToastContext);

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fullScreen, setFullScreen] = useState(true);
  const [assetFieldOptions, setAssetFieldOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssetFieldOptions();
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data: { data } }) => {
        let fieldsData = data.filter((obj) => obj.fieldData?.fieldName === 'frequency').map((d: any) => d.fieldData);
        setInitialData({
          fields: fieldsData,
          values: {
            condition: serviceData?.condition || [],
            ...getObjKeysWithValues({ frequency: serviceData?.frequency || '' }, fieldsData)
          }
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [serviceData?._id]);

  const fetchAssetFieldOptions = async () => {
    const fields = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    const fieldsData = fields.data?.data;
    const assetFields = fieldsData
      .filter((field) => ['number', 'decimal'].includes(field.fieldData.type))
      ?.map((ele) => {
        return {
          optionValue: ele.fieldData.fieldName,
          optionLabel: ele.fieldData.fieldLabel,
        };
      });

    setAssetFieldOptions(assetFields);
  };

  const handleSave = (values) => {
    setLoading(true);
    axiosInstance()
      .put(`${routes.product.path}/${productId}/service-master/update-service-data`, { ...values, _id: serviceData?._id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setLoading(false);
        onSuccess();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  function validate(values) {
    const errors = {};
    if (values?.condition?.length > 0) {
      values?.condition?.forEach((cnd: any, i) => {
        if (!cnd?.field) {
          errors[`condition.${i}.field`] = 'Field is Required';
        }
        if (!cnd?.operator) {
          errors[`condition.${i}.operator`] = 'Operator is Required';
        }
        if (!cnd?.value) {
          errors[`condition.${i}.value`] = 'Value is Required';
        }
      });
    }
    return errors;
  }

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      open={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
      aria-labelledby="assign-roles-dialog"
    >
      {initialData?.fields?.length ? (
        <>
          <CustomDialogHeader
            title={`Edit Frequency/Condition`}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            showRequiredLabel={true}
            onClose={onClose}
          />
          <Formik initialValues={initialData.values} onSubmit={handleSave} validateOnMount validate={validate}>
            {({ values, errors, touched, submitForm, setFieldValue }) => (
              <>
                <CustomDialogContent>
                  <Form autoComplete="off" autoCorrect="off" noValidate>
                    <InputField
                      errors={errors}
                      values={values}
                      setFieldValue={setFieldValue}
                      touched={touched}
                      fieldsData={initialData.fields}
                      size="small"
                      fullWidth
                    />
                    <div className="conditions-container container-with-border mb-2 p-2 sm:mb-3 sm:p-3 md:mb-4 md:p-4">
                      <div className="grid gap-4">
                        <FieldArray name="condition">
                          {({ push, remove }) => (
                            <div className=" flex flex-col gap-2">
                              <div className="flex w-full items-center justify-between">
                                <h2 style={{ margin: 0 }} className="form-label-style mb-3">
                                  Conditions
                                </h2>
                                <HtmlTooltip title='Add'>
                                <IconButton size="small" aria-label="add" onClick={() => push({ field: null, operator: null, value: null })}>
                                  <AddIcon fontSize="small" color={'primary'} />
                                </IconButton>
                                </HtmlTooltip>
                              </div>

                              {values?.condition?.map((cnd, i) => {
                                return (
                                  <Box className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr_auto]">
                                    <Box>
                                      <Autocomplete
                                        options={assetFieldOptions}
                                        getOptionLabel={(option) => option?.optionLabel || ''}
                                        value={assetFieldOptions?.find((data) => data?.optionValue === values?.condition[i]?.field) ?? ''}
                                        fullWidth
                                        onChange={(e, newValue) => {
                                          setFieldValue(`condition.${i}.field`, newValue?.optionValue);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="Field"
                                            margin="none"
                                            size="small"
                                            error={
                                              touched?.condition && touched?.condition[i]?.field && Boolean(errors[`condition.${i}.field`])
                                            }
                                            helperText={
                                              touched?.condition && touched?.condition[i]?.field && errors[`condition.${i}.field`]
                                            }
                                            variant="outlined"
                                          />
                                        )}
                                      />
                                    </Box>
                                    <Box>
                                      <Autocomplete
                                        options={OPERATOR}
                                        getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                                        value={OPERATOR?.find((data) => data?.optionValue === values?.condition[i]?.operator) ?? ''}
                                        fullWidth
                                        onChange={(event, newValue: any) => {
                                          setFieldValue(`condition.${i}.operator`, newValue?.optionValue);
                                        }}
                                        size="small"
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label="Operator"
                                            margin="none"
                                            size="small"
                                            error={
                                              touched?.condition && touched?.condition[i]?.operator && Boolean(errors[`condition.${i}.operator`])
                                            }
                                            helperText={touched?.condition && touched?.condition[i]?.operator && errors[`condition.${i}.operator`]}
                                            variant="outlined"
                                          />
                                        )}
                                      />
                                    </Box>
                                    <Box>
                                      <TextField
                                        margin="none"
                                        size="small"
                                        type="number"
                                        label="Value"
                                        name="value"
                                        variant="outlined"
                                        fullWidth
                                        value={values?.condition[i]?.value}
                                        error={touched?.condition && touched?.condition[i]?.value && Boolean(errors[`condition.${i}.value`])}
                                        helperText={touched?.condition && touched?.condition[i]?.value && errors[`condition.${i}.value`]}
                                        onChange={(e) => {
                                          setFieldValue(`condition.${i}.value`, parseFloat(e.target.value));
                                        }}
                                      />
                                    </Box>
                                    <Box className=" ml-auto max-w-fit" display="flex" justifyContent="space-between" alignItems="center">
                                    <HtmlTooltip title='Remove'>
                                      <IconButton size="small" aria-label="close" onClick={() => remove(i)}>
                                        <CloseIcon fontSize="small" color={'primary'} />
                                      </IconButton>
                                    </HtmlTooltip>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </div>
                          )}
                        </FieldArray>
                      </div>
                    </div>
                  </Form>
                </CustomDialogContent>
                <CustomDialogFooter>
                  <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                    Cancel
                  </Button>
                  <CustomButton
                    disabled={isEqual(initialData?.values, values)}
                    loading={loading}
                    variant="contained"
                    color="primary"
                    onClick={submitForm}
                  >
                    Save
                  </CustomButton>
                </CustomDialogFooter>
              </>
            )}
          </Formik>
        </>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default FrequencyDialog;
