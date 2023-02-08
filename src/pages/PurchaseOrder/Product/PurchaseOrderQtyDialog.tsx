import { ChangeEvent, FC, FormEvent, useEffect, useState, Fragment } from 'react';
import {
  Button,
  Dialog,
  TextField,
  Grid,
  Box,
} from '@material-ui/core';
import moment from 'moment';
import { arrayToDropwdownOption } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeysWithValues, getObjKeys, yupSchema } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../../../constants/helpers";
import { Formik, Form } from "formik";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomButton from '../../../components/Helpers/CustomButton'
import { FaDiceOne } from "react-icons/fa";
import FormTypes from "../../../components/Helpers/FormTypes";
import { uniq, map, orderBy, isEqual } from 'lodash';
import { autoCalculateSpecificFields } from "../../../constants/formulaUtility";
import { fetch_po_product_fields } from '../../../components/PurchaseOrder/helper';

const PurchaseOrderQtyDialog = ({ onClose, onSubmit, productData, bulkEdit, purchaseOrderData, nextRowData }) => {

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchField()
  }, []);

  const fetchField = async () => {
    var poFields = await fetch_po_product_fields(purchaseOrderData?.currency);
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
          if (unitOptions?.length) {
            element.isDefaultValue = true;
            element.defaultValue = unitOptions[0]?.optionValue;
          }
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      })
      poFields = poFields.filter((e: any) => !e.isUneditable && !e.disableOnEdit)
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
  }

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
        returnData.push({ _id: element._id, productId: element.productId, ...calValues })
      })
    }
    else {
      returnData = [{ ...values, _id: productData._id, productId: productData.productId }]
    }
    onSubmit(returnData)
  };

  function validate(values) {
    const errors = {};
    if (values?.qty < values?.actualReceived + values?.rejectQuantity || 0) {
      errors['qty'] = 'Quantity should be greater than Actual Received and Reject Quantity';
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
              title={bulkEdit ? "Bulk Edit" : `Edit - ${productData?.index} (${productData?.detail || ""})`}
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
              {nextRowData &&
                <CustomButton
                  loading={loading}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}
                > Save & Next
                </CustomButton>}
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
