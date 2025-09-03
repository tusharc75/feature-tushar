import { Fragment, useEffect, useState } from 'react';
import { Autocomplete, Box, Dialog, IconButton, TextField } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import { FieldArray, Form, Formik } from 'formik';
import {
  arrayToDropwdownOption,
  CHILD_RESOURCE,
  CustomDialogTransition,
  getObjKeys,
  getObjKeysWithValues,
  MATERIAL_TYPE,
  PLANNING_STATUS,
  yupSchema
} from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { autoCalculateSpecificFields } from 'src/constants/formulaUtility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import InputField from 'src/components/Helpers/InputField';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { getParentMultiplier } from 'src/pages/RentalManagement/rentalOfflineHelper';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Add, Delete } from '@mui/icons-material';
import CustomDateTimePicker from 'src/components/CustomDateTimePicker';
import dayjs from 'dayjs';

const MaterialDialog = ({
  onClose,
  materialData,
  planningData,
  handleUpdate,
  loadingEdit,
  isBulkedit,
  showSaveAndNext,
  material,
  dataRows,
  subStatusOptions
}) => {
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [saveAndNext, setSaveAndNext] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [dates, setDates] = useState(materialData?.dates?.length > 0 ? materialData?.dates : [{ startDate: null, endDate: null, subStatus: '' }]);

  useEffect(() => {
    fetchFields();
  }, [materialData]);

  const fetchFields = async () => {
    setInitialData({ fields: [], values: {} });
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.planningMaterial, planningData?.currency, true);
    if (isBulkedit) {
      let unitArray: any = [];
      materialData?.forEach((element) => {
        if (element?.[`${element.type}Detail`]?.unit) {
          unitArray.push([...element?.[`${element.type}Detail`]?.unit]);
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit);
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: getObjKeys('', data)
      });
    } else {
      let unitOptions: any = [];
      if (materialData?.[`${materialData.type}Detail`]?.unit) {
        unitOptions = arrayToDropwdownOption(materialData?.[`${materialData.type}Detail`]?.unit);
      }
      data.forEach((element) => {
        if (element.fieldName === 'unit') {
          element.option = unitOptions;
        }
      });
      setAllFields(JSON.parse(JSON.stringify(data)));
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(materialData, data)
      });
    }
  };

  const handleSubmit = async (values) => {
    let returnData = [];
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x];
        }
      }
      materialData.forEach((element) => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields);
        if (values?.dates?.length > 0) {
          calValues.dates = values.dates;
        }
        returnData.push({ _id: element._id, ...calValues });
      });
      handleUpdate(returnData);
    } else {
      if (materialData.parentId && !showConfirmationDialog) {
        setShowConfirmationDialog(true);
      } else {
        const rows = await calculateRowsField(material, values, allFields, materialData, planningData?.currency);
        if (values?.dates?.length > 0) {
          rows[0].dates = values.dates;
        }
        handleUpdate(rows, saveAndNext);
        setShowConfirmationDialog(false);
      }
    }
  };

  function validate(values) {
    const errors: any = {};
    if (isBulkedit) {
      if (materialData?.find((e) => e?.assetQty || e?.nonSerializedQty) && values?.qty) {
        errors['qty'] = `Bulk quantity update is restricted when an asset is assigned `;
      }
    } else {
      let isValid = true;
      if (materialData?.type === MATERIAL_TYPE.product && !materialData?.parentId) {
        if (values?.qty < materialData?.assetQty) {
          isValid = false;
        }
      } else {
        const child: any = dataRows?.filter((e) => e.parentId === materialData?._id);
        if (child?.length) {
          child?.forEach((e) => {
            let qty = values.qty * e?.qty;
            if (qty < e?.assetQty) {
              isValid = false;
              return;
            }
          });
        } else {
          const qty = getParentMultiplier(material, materialData) * values.qty;
          if (qty < materialData?.assetQty) {
            isValid = false;
          }
        }
      }
      if (!isValid) {
        errors['qty'] = 'The quantity is less than what was assigned.';
      }
    }
    if (values?.dates?.length > 0) {
      values?.dates?.forEach((d, i) => {
        if (showDates) {
          if (!d.startDate) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { startDate: 'Start Date is required' };
          }
          if (!d.endDate) {
            if (!errors?.dates) {
              errors['dates'] = [];
            }
            errors.dates[i] = { endDate: 'End Date is required' };
          }

          if (d.startDate && d.endDate) {
            const start = dayjs.tz(new Date(d.startDate));
            const end = dayjs.tz(new Date(d.endDate));

            if (start.isAfter(end)) {
              if (!errors?.dates) {
                errors['dates'] = [];
              }
              errors.dates[i] = { endDate: 'End Date must be after Start Date' };
            }
          }

          if (i > 0 && d?.startDate && values?.dates[i - 1]?.endDate) {
            const currentStart = dayjs.tz(new Date(d.startDate));
            const prevEnd = dayjs.tz(new Date(values?.dates[i - 1].endDate));

            if (currentStart.isSameOrBefore(prevEnd)) {
              if (!errors?.dates) {
                errors['dates'] = [];
              }
              errors.dates[i] = { startDate: 'Start Date overlaps with the previous range' };
            }
          }
        }

        if (!d?.subStatus) {
          if (!errors?.dates) {
            errors['dates'] = [];
          }
          errors.dates[i] = { ...errors.dates[i], subStatus: 'Status is required' };
        }
      });
    }
    return errors;
  }

  const addRemove = (values, type, index) => {
    let dates = [...values];
    if (type === 'add') {
      dates.splice(index, 0, {
        startDate: null,
        endDate: null,
        subStatus: ''
      });
    } else {
      dates.splice(index, 1);
    }
    setDates([...dates]);
  };

  const showDates = planningData?.type === 'Rental Job' && materialData?.type === MATERIAL_TYPE.product && subStatusOptions?.length > 0;

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          enableReinitialize={true}
          initialValues={{ ...initialData.values, dates }}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={isBulkedit ? 'Bulk Edit' : `Edit - ${materialData?.index} (${materialData?.detail || ''})`}
                onClose={() => {
                  onClose();
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
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
                  {showDates && (
                    <FieldArray
                      name="dates"
                      render={(arrayHelpers) => (
                        <div className="space-y-4">
                          {values?.dates?.length
                            ? values?.dates?.map((_date, index) => {
                              return (
                                <div
                                  key={index}
                                  className={
                                    'grid grid-cols-[1fr_30px] flex-wrap items-center gap-2 rounded-md border bg-gray-50 p-4 dark:bg-gray-800 sm:grid-cols-[1fr_1fr_1fr_30px]'
                                  }
                                >
                                  <div className="max-sm:col-start-1">
                                    <CustomDateTimePicker
                                      fullWidth
                                      size="small"
                                      margin="dense"
                                      required
                                      value={_date?.startDate}
                                      name="startDate"
                                      placeholder={`Start Date-Time`}
                                      label={`Start Date-Time`}
                                      onChange={(value) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.dates[index],
                                          startDate: value || null
                                        });
                                      }}
                                      error={
                                        touched?.dates &&
                                        touched?.dates[index]?.startDate &&
                                        errors?.dates &&
                                        Boolean(errors?.dates[index]?.startDate)
                                      }
                                      helperText={
                                        touched?.dates && touched?.dates[index]?.startDate && errors?.dates && errors?.dates[index]?.startDate
                                      }
                                    />
                                  </div>
                                  <div className="max-sm:col-start-1">
                                    <CustomDateTimePicker
                                      fullWidth
                                      size="small"
                                      margin="dense"
                                      required
                                      value={_date?.endDate}
                                      name="endDate"
                                      placeholder={`End Date-Time`}
                                      label={`End Date-Time`}
                                      onChange={(value) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.dates[index],
                                          ['endDate']: value || null
                                        });
                                      }}
                                      {...(_date?.startDate ? { minDateTime: _date?.startDate } : {})}
                                      error={
                                        touched?.dates && touched?.dates[index]?.endDate && errors?.dates && Boolean(errors?.dates[index]?.endDate)
                                      }
                                      helperText={
                                        touched?.dates && touched?.dates[index]?.endDate && errors?.dates && errors?.dates[index]?.endDate
                                      }
                                    />
                                  </div>
                                  <div className="max-sm:col-start-1">
                                    <Autocomplete
                                      options={subStatusOptions}
                                      fullWidth
                                      getOptionLabel={(option: any) => (option ? option : '')}
                                      value={_date?.subStatus}
                                      onChange={(e, val) => {
                                        arrayHelpers.replace(index, {
                                          ...values?.dates[index],
                                          subStatus: val || ''
                                        });
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          margin="dense"
                                          size="small"
                                          name="subStatus"
                                          label="Sub Status"
                                          variant="outlined"
                                          fullWidth
                                          required
                                          error={
                                            touched?.dates &&
                                            touched?.dates[index]?.subStatus &&
                                            errors?.dates &&
                                            Boolean(errors?.dates[index]?.subStatus)
                                          }
                                          helperText={
                                            touched?.dates && touched?.dates[index]?.subStatus && errors?.dates && errors?.dates[index]?.subStatus
                                          }
                                        />
                                      )}
                                    />
                                  </div>

                                  <div className="max-sm:col-start-2 max-sm:row-start-2">
                                    <HtmlTooltip title="Remove">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          addRemove(values?.dates, 'remove', index);
                                        }}
                                        aria-label="Remove"
                                        color={'error'}
                                      >
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </HtmlTooltip>
                                  </div>
                                </div>
                              );
                            })
                            : null}
                        </div>
                      )}
                    />
                  )}
                </Form>
                {showDates && (
                  <div className="mt-4">
                    <ThemeButton
                      buttonType="themeBorder"
                      startIcon={<Add />}
                      onClick={() => {
                        addRemove(values?.dates, 'add', values?.dates?.length);
                      }}
                    >
                      Add Date
                    </ThemeButton>
                  </div>
                )}
              </CustomDialogContent>
              <CustomDialogFooter>
                <ThemeButton
                  buttonType="transparent"
                  onClick={() => {
                    onClose();
                  }}
                >
                  {'Close'}
                </ThemeButton>
                {isBulkedit === false && showSaveAndNext && (
                  <ThemeButton
                    isLoading={loadingEdit}
                    disabled={loadingEdit}
                    buttonType="theme"
                    onClick={() => {
                      setSaveAndNext(true);
                      submitForm();
                    }}
                  >
                    {' '}
                    Save & Next
                  </ThemeButton>
                )}
                <ThemeButton
                  isLoading={loadingEdit}
                  disabled={loadingEdit}
                  buttonType="theme"
                  onClick={() => {
                    setSaveAndNext(false);
                    submitForm();
                  }}
                >
                  Save
                </ThemeButton>
              </CustomDialogFooter>
              {showConfirmationDialog && (
                <ConfirmationDialog
                  open={showConfirmationDialog}
                  message="Would you prefer to override the parent-level price configuration?"
                  onOk={() => {
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmationDialog(false);
                  }}
                />
              )}
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

export default MaterialDialog;
