import { Fragment, useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { CustomDialogTransition, getObjKeysWithValues, yupSchema, sidebarResource, serializedAsset, getObjKeys, DELIVERY_TICKET_TYPE } from '../../../constants/helpers';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from 'src/axios/axiosInstance';
import { FieldArray, Form, Formik } from 'formik';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CircularProgress, Typography } from '@material-ui/core';
import FormTypes from 'src/components/Helpers/FormTypes';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import { isArray, isEqual, isString } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { read, utils, writeFile } from 'xlsx';

export default function AssetDetailsChangeDialog({
  onClose,
  onSuccess,
  statusPolicy,
  ids,
  setAssetsData,
  staticLookUpFilters = {},
  productsDefaultData = [],
  ticketType = null,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const [decimalFields, setDecimalFields] = useState([]);
  const [allFields, setAllFields] = useState([]);

  const [assetHeaders, setAssetHeaders] = useState({ assetNumber: '', product: '' });


  useEffect(() => {
    fetchFields();
  }, [statusPolicy]);

  const fetchFields = async () => {
    const data = await axiosInstance().get(`${serializedAsset.api}?getById=${JSON.stringify(ids)}`);
    const assetData = data?.data?.data;

    const fields = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    let fieldsData = fields?.data?.data;

    setAssetHeaders({
      assetNumber: fieldsData?.find((e) => e.fieldData?.fieldName === 'assetNumber')?.fieldData?.fieldLabel || 'Asset',
      product: fieldsData?.find((e) => e.fieldData?.fieldName === 'product')?.fieldData?.fieldLabel || 'Product'
    })
    setAllFields(JSON.parse(JSON.stringify(fieldsData)));
    fieldsData = fieldsData.filter((d) => statusPolicy?.fields?.includes(d.fieldData.fieldName));
    let fieldsDataForUpdate = fieldsData?.map((d: any) => d.fieldData);
    let values = {};
    let tempAssetData = [];
    const decimalField = [];
    let i = 0;
    let j = 0;
    let index = null;
    let product = assetData?.length > 0 ? assetData[0]?.product?.optionValue : '';

    assetData?.forEach((data) => {
      if (product !== data?.product?.optionValue) {
        j = 0;
        i = 0;
        index = null;
        product = data?.product?.optionValue;
      }
      let initialValues = getObjKeysWithValues(data, fieldsDataForUpdate);
      if (statusPolicy?.sumDecimalField || statusPolicy?.autoIncrementDecimalField) {
        fieldsDataForUpdate?.forEach((e) => {
          if (e?.type === 'decimal' && statusPolicy?.sumDecimalField) {
            decimalField.push(e.fieldName);
            initialValues[`${e.fieldName}_orignal`] = initialValues[e.fieldName];
            initialValues[e.fieldName] = 0;
          } else if (e?.type === 'decimal' && statusPolicy?.autoIncrementDecimalField) {
            if (!ticketType || ticketType && ticketType !== DELIVERY_TICKET_TYPE.return) {
              initialValues[e.fieldName] = (initialValues[e.fieldName] || 0) + 1;
            }
          }
        });
      }
      initialValues['_id'] = data?._id;
      initialValues['assetNumber'] = data?.assetNumber;
      initialValues['productName'] = data?.product?.optionLabel;


      const assetDefaultData = productsDefaultData?.find((e) => e.materialId === data?.product?.optionValue)?.assetDefaultData;
      if (!index) {
        index = assetDefaultData?.length > 0 ? assetDefaultData[0]?.qty : null;
      }
      if (index === i) {
        j = j + 1;
        index = index + assetDefaultData[j]?.qty;
        i = 0;
      }

      if (assetDefaultData?.length > 0) {
        if (j <= assetDefaultData?.length && assetDefaultData[j]) {
          for (const key in assetDefaultData[j]) {
            if (key != 'qty') {
              const field = fieldsDataForUpdate?.find((e) => e.fieldName === key);
              if (assetDefaultData[j][key] && field) {
                if (field?.type === 'multiSelect' && isString(assetDefaultData[j][key])) {
                  initialValues[key] = [assetDefaultData[j][key]];
                } else {
                  initialValues[key] = assetDefaultData[j][key];
                }
              }
            }
          }
        }
      }
      tempAssetData.push(initialValues);
      i = i + 1;
    });
    values['assetData'] = tempAssetData;
    setDecimalFields(decimalField);
    fieldsDataForUpdate?.forEach((element) => {
      if (element?.lookup && staticLookUpFilters[element?.fieldName] && isArray(staticLookUpFilters[element?.fieldName])) {
        element.option = element.option?.filter((ele) => staticLookUpFilters[element?.fieldName]?.includes(ele.optionValue));
      }
    });
    setInitialData({
      fields: fieldsDataForUpdate,
      values: values
    });
  };

  const handleSubmit = (values) => {
    setSubmitting(true);
    const data = [];
    let fieldsDataReset = [];
    if (statusPolicy?.fieldsReset?.length) {
      fieldsDataReset = allFields.filter((d) => statusPolicy?.fieldsReset?.includes(d.fieldData.fieldName)).map((d: any) => d.fieldData);
    }
    values?.assetData?.forEach((ele) => {
      const obj: any = { _id: ele._id };
      statusPolicy?.fields?.forEach((fieldName) => {
        if (statusPolicy?.sumDecimalField && decimalFields?.includes(fieldName)) {
          obj[fieldName] = parseFloat(ele[fieldName] || 0) + parseFloat(ele[`${fieldName}_orignal`] || 0);
        } else {
          obj[fieldName] = ele[fieldName];
        }
      });
      let resetValues = {};
      if (fieldsDataReset?.length) {
        resetValues = getObjKeys('', fieldsDataReset);
      }
      data.push({ ...obj, ...resetValues });
    });
    if (setAssetsData) {
      setAssetsData(data);
    }
    onSuccess(data);
    setSubmitting(false);
  };

  const validate = (values) => {
    const errors = {
      assetData: []
    };
    values.assetData.forEach((value, index) => {
      const assetErrors = {};
      initialData.fields.forEach((field) => {
        const fieldName = field.fieldName;
        if (!value[fieldName] && field.required) {
          assetErrors[fieldName] = `${field.fieldLabel} is required`;
        }
      });
      if (Object.keys(assetErrors).length > 0) {
        errors.assetData[index] = { ...assetErrors };
      }
    });
    return errors?.assetData?.length ? errors : {};
  };

  const getValueInExport = (data: any, field: any) => {
    if (field?.type === 'multiSelect') {
      data = field?.option
        ?.filter((o) => data.includes(o?.optionValue))
        ?.map((d) => d?.optionLabel)
        ?.join('—');
    } else if (field?.type === 'dropDown') {
      data = field?.option?.find((o) => o?.optionValue === data)?.optionLabel;
    }
    return data;
  };

  const handleExport = (values) => {
    const { assetData } = values;
    const fieldNames = initialData?.fields?.map((f) => f?.fieldName);

    const json_data = assetData?.map((_data) => {
      const dynamicFields = fieldNames?.reduce((acc, f) => {
        const field = initialData?.fields?.find((_f) => _f?.fieldName === f);
        const _key = field?.fieldLabel;
        acc[_key] = getValueInExport(_data[f], field);
        return acc;
      }, {});

      return {
        [assetHeaders.assetNumber]: _data?.assetNumber || '',
        [assetHeaders.product]: _data?.productName || '',
        ...dynamicFields
      };
    });

    const field_option_label = initialData?.fields
      ?.filter((f) => f?.type === 'dropDown' || f?.type === 'multiSelect')
      ?.map((field) => {
        return [...field?.option?.map((o) => ({ [field?.fieldLabel]: o?.optionLabel }))];
      });

    const maxLength = Math.max(...field_option_label.map((arr) => arr.length));
    const json_data_value = [];

    for (let i = 0; i < maxLength; i++) {
      const mergedObject = {};
      for (const arr of field_option_label) {
        if (arr[i]) {
          Object.assign(mergedObject, arr[i]);
        }
      }
      json_data_value.push(mergedObject);
    }

    const header1 = [assetHeaders.assetNumber, assetHeaders.product, ...initialData?.fields?.map((f) => f?.fieldLabel)];

    const header2 = initialData?.fields?.filter((f) => f?.type === 'dropDown' || f?.type === 'multiSelect')?.map((f) => f?.fieldLabel);

    const ws = utils.json_to_sheet(json_data);
    const ws_value = utils.json_to_sheet(json_data_value);
    if (header1.length) {
      utils.sheet_add_aoa(ws, [header1]);
    }
    if (header2.length) {
      utils.sheet_add_aoa(ws_value, [header2]);
    }
    const wb = utils.book_new();

    utils.book_append_sheet(wb, ws, 'Sheet1');
    utils.book_append_sheet(wb, ws_value, 'Value');
    writeFile(wb, `${routes.serializedAsset.title} Data.xlsx`);
  };

  const getValueInImport = (data: any, asset: string, product: string, fieldLabel: string, assetData: any[]) => {
    const index = assetData?.findIndex((a) => a?.assetNumber === asset && a?.productName === product);
    const field = initialData?.fields?.find((f) => f?.fieldLabel === fieldLabel);
    if (index > -1 && field) {
      if (field?.type === 'multiSelect') {
        let value = [];
        const _data = data?.split('—');
        _data?.forEach((d) => {
          const option = field?.option?.find((o) => o?.optionLabel === d);
          if (option) {
            value.push(option?.optionValue);
          }
        });
        data = value;
      } else if (field?.type === 'dropDown') {
        data = data
          ? field?.option?.filter((o) => o?.optionLabel === data)?.length > 0
            ? field?.option?.filter((o) => o?.optionLabel === data)[0]?.optionValue
            : ''
          : '';
      } else if (field?.type === 'singleLine') {
        data = `${data}`;
      }
      return { index, fieldName: field?.fieldName, value: data };
    } else {
      return null;
    }
  };

  const handleImport = (setFieldValue: any, values: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files,
      f = files[0];
    let reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = read(data, { type: 'binary' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const parsedData = utils.sheet_to_json(ws, { header: 1 });

      if (parsedData.length > 1) {
        let header = parsedData.slice(0, 1)[0];
        let row = parsedData.slice(1, parsedData.length);
        row.forEach((item: any[]) => {
          item?.forEach((_d, i) => {
            if (i != 0 && i != 1) {
              const { index, fieldName, value } = getValueInImport(_d, item[0], item[1], header[i], values?.assetData);
              setFieldValue(`assetData.${index}.${fieldName}`, value);
            }
          });
        });
      }
    };
    reader.readAsBinaryString(f);
    e.target.value = null;
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      open={true}
      fullScreen={fullScreen}
      aria-labelledby="customized-dialog-title"
      fullWidth
      maxWidth={'md'}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      {initialData.fields.length ? (
        <Formik initialValues={initialData.values} enableReinitialize={true} validate={validate} onSubmit={handleSubmit}>
          {({ values, errors, setFieldValue, touched, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                onClose={() => {
                  if (isEqual(initialData.values, values)) onClose();
                  else setShowConfirmDialog(true);
                }}
                title={routes.serializedAsset.title}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              />
              <CustomDialogContent>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box className="form-box">
                    <Box mb={1} display="flex" justifyContent="flex-end">
                      <Box mr={2}>
                        <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }} onClick={() => handleExport(values)}>
                          Export
                        </Typography>
                      </Box>
                      <Box mr={1}>
                        <input
                          accept="json"
                          style={{ display: 'none' }}
                          onChange={handleImport(setFieldValue, values)}
                          id="import-file"
                          multiple={false}
                          type="file"
                        />
                        <label htmlFor="import-file">
                          <Typography className="cursor-pointer" style={{ color: 'var(--primary)' }}>
                            Import
                          </Typography>
                        </label>
                      </Box>
                    </Box>
                    <FieldArray
                      name="assetData"
                      render={(arrayHelpers) => (
                        <div className="grid gap-[15px] sm:gap-[18px]">
                          {values?.assetData?.map((data, index) => (
                            <div
                              style={{ border: '1.5px solid var(--common-border-color)' }}
                              className=" flex flex-col rounded-[6px] px-[23px] pb-[21px] pt-[17px] shadow-[0px_4px_26.8799991607666px_0px_rgba(0,0,0,0.06)]"
                              key={index}
                            >
                              <div>
                                <span className="font-semibold text-[var(--primary-text)]">{`${data?.assetNumber} (${data?.productName})`}</span>
                              </div>
                              <div className="mt-[28px] grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-3">
                                {initialData?.fields.map((field) => (
                                  <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                    <FormTypes
                                      {...field}
                                      fieldData={field}
                                      values={data}
                                      errors={(errors['assetData'] && errors['assetData'][index]) ?? {}}
                                      touched={(touched['assetData'] && touched['assetData'][index]) ?? {}}
                                      disabled={field?.disableOnEdit || field?.isUneditable}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(`assetData.${index}.${field.fieldName}`, value);
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                      fields={initialData?.fields}
                                    />
                                  </Grid>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    />
                  </Box>
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  id={'asset-details-change-dialog-cancel-button'}
                  disabled={submitting}
                  onClick={() => {
                    if (isEqual(initialData.values, values)) onClose();
                    else setShowConfirmDialog(true);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  disabled={submitting}
                  variant="contained"
                  color="primary"
                  size="small"
                  type="submit"
                  onClick={submitForm}
                  id={'asset-details-change-dialog-save-button'}
                  endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                  {' '}
                  Save
                </Button>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmationCancelDialog
                  close={() => setShowConfirmDialog(false)}
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
          <CommonSkeleton lenArray={[...Array(14).keys()]} />
        </Box>
      )}
    </Dialog>
  );
}
