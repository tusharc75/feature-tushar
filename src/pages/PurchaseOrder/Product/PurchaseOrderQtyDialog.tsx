import { ChangeEvent, FC, FormEvent, useEffect, useState, Fragment } from 'react';
import {
  Button,
  Dialog,
  TextField,
  Grid,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText
} from '@material-ui/core';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateUtils from '@date-io/date-fns';
import moment from 'moment';
import { arrayToDropwdownOption, dateFormatForInputControl } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { startCase } from 'lodash';
import axiosInstance from "../../../axios/axiosInstance";
import { groupBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema, CHILD_RESOURCE } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, isFieldNotTouched } from "../../../constants/helpers";
import { Formik, Form } from "formik";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomButton from '../../../components/Helpers/CustomButton'
import { FaDiceOne } from "react-icons/fa";
import FormTypes from "../../../components/Helpers/FormTypes";
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";

interface PurchaseOrderQtyDialogProps {
  onClose: VoidFunction | any;
  currency: string;
  onSubmit: VoidFunction | any;
  productData?: object | any;
  purchaseOrderData?: object | any;
  bulkEdit?: boolean | any;
}

const PurchaseOrderQtyDialog: FC<PurchaseOrderQtyDialogProps> = ({ onClose, currency, onSubmit, productData, bulkEdit, purchaseOrderData }) => {

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.purchaseOrderProduct}`).then(({ data: { data } }) => {
      const poFields = CURReplaceByCurrencySingle(data, currency);
      setAllFields(JSON.parse(JSON.stringify(poFields)))
      if (bulkEdit) {
        let unitArray: any = []
        productData?.forEach(element => {
          if (element?.productDetail?.unit) {
            unitArray.push([...element?.productDetail?.unit])
          }
        });
        let unit: any = unitArray?.shift()?.filter(function (v) {
          return unitArray.every(function (a) {
            return a.indexOf(v) !== -1;
          });
        });
        const unitOptions: any = arrayToDropwdownOption(unit)
        poFields.forEach((element) => {
          if (element.fieldName === "unit") {
            element.option = unitOptions;
          }
          element.required = false;
          element.isFormula = false;
          element.isMulitFormula = false;
        })
        setInitialData({
          fields: poFields,
          values: { ...getObjKeys("", poFields), expectedDelivery: "" },
        });
      }
      else {

        poFields.filter((_f) => {
          if (["unit"].includes(_f.fieldName.toLowerCase())) {
            if (productData?.productDetail?.unit) {
              _f.option = arrayToDropwdownOption(productData?.productDetail?.unit)
            }
          }
        })

        let tempObjKeysWithValues = getObjKeysWithValues(productData, poFields)
        if (!tempObjKeysWithValues["taxSchedule"] && purchaseOrderData["taxSchedule"]) {
          tempObjKeysWithValues["taxSchedule"] = purchaseOrderData["taxSchedule"]
        }
        if (!tempObjKeysWithValues["expectedDelivery"] && purchaseOrderData["deliveryDate"]) {
          tempObjKeysWithValues["expectedDelivery"] = purchaseOrderData["deliveryDate"]
        }
        setInitialData({
          fields: poFields,
          values: tempObjKeysWithValues,
        });
      }
      EvaluteproductFields(poFields);
    })
  }, []);

  const EvaluteproductFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData)
  }

  const handleSubmit = (values) => {
    let returnData = []
    if (bulkEdit) {
      for (const x in values) {
        if (values[x] === "" || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x]
        }
      }
      productData.forEach(element => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
        returnData.push({ ...element, ...calValues })
      })
    }
    else {
      returnData = [{ ...values, _id: productData._id, productId: productData.productId }]
    }
    onSubmit(returnData)
  };

  function validate(values) {
    const errors = {};
    if (values?.qty < values?.actualReceived) {
      errors['qty'] = 'Quantity should be greater than Actual Received';
    }
    return errors;
  }

  return (<Dialog
    maxWidth="md"
    fullScreen={fullScreen || (isMobile || isTablet)}
    TransitionComponent={CustomDialogTransition}
    aria-labelledby="customized-dialog-title"
    open={true}
    fullWidth
  >
    {initialData && initialData.fields.length ?
      <Formik
        enableReinitialize={true}
        initialValues={initialData.values}
        validationSchema={yupSchema(initialData.fields)}
        validate={validate}
        onSubmit={handleSubmit}>
        {({ values,
          errors,
          touched,
          setFieldValue,
          submitForm,
        }) => (
          <Fragment>
            <CustomDialogHeader
              title={bulkEdit ? "Bulk Edit" : `Edit ${productData?.productName || ""}`}
              onClose={() => {
                onClose()
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Form autoComplete="off" autoCorrect="off" noValidate >
                {fields && fields.map((section, i) => (
                  <div key={i}>
                    <div className={"detail-box-content detail-product-box"}>
                      <div className={"product-form-layout"}>
                        <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                        <h2 className={`${"form-label-style"} ${"form-label-product"}`} >
                          {section.name}
                        </h2>
                      </div>
                    </div>
                    <Box marginY={2}>
                      <Grid spacing={3} container>
                        {section.sectionFields && section.sectionFields.map((field) => (
                          (field.type === "converter" || field.type === "currencyAmount" || field.isConverter) ?
                            <FormTypes
                              fields={initialData.fields}
                              fieldData={{ ...field, hideConverter: true }}
                              values={values}
                              errors={errors}
                              touched={touched}
                              label={field.fieldLabel}
                              name={field.fieldName}
                              type={field.type}
                              options={field.option}
                              setFieldValue={(name, value) => {
                                setFieldValue(name, value)
                              }}
                              required={field.required}
                              fullWidth
                              isTooltip={field.isTooltip}
                              tooltipMessage={field.tooltipMessage}
                              size="small"
                            /> :
                            <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                              <Box display="flex" >
                                <Box flexGrow={1}  >
                                  {(field.fieldName === "expectedDelivery") ?
                                    < FormTypes
                                      {...field}
                                      values={values}
                                      minDate={moment(new Date())}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value)
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field?.isTooltip || false}
                                      tooltipMessage={field?.tooltipMessage}
                                      size="small"
                                    /> :
                                    <FormTypes
                                      {...field}
                                      fields={initialData.fields}
                                      fieldData={field}
                                      values={values}
                                      errors={errors}
                                      touched={touched}
                                      label={field.fieldLabel}
                                      name={field.fieldName}
                                      type={field.type}
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value)
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field.isTooltip}
                                      tooltipMessage={field.tooltipMessage}
                                      size="small"
                                    />
                                  }
                                </Box>
                              </Box>
                            </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </div>
                ))}
              </Form>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button size="small" color="primary"
                onClick={() => {
                  onClose()
                }}
              >{"Close"}</Button>
              <CustomButton
                loading={loading}
                variant="contained"
                color="primary"
                type="submit"
                onClick={submitForm}
              > Save
              </CustomButton>
            </CustomDialogFooter>
          </Fragment>
        )}
      </Formik>
      :
      <Box p={2} height={500} bgcolor="white">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>}
  </Dialog>);
};

export default PurchaseOrderQtyDialog;
