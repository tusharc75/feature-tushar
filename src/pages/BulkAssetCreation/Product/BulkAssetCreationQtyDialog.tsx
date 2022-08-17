import { ChangeEvent, FC, FormEvent, useEffect, useState, Fragment } from 'react';
import {
  Button,
  Dialog,
  TextField,
  Grid,
  Box,
} from '@material-ui/core';
import moment from 'moment';
import { arrayToDropwdownOption, CHILD_RESOURCE } from '../../../constants/helpers';
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
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import axiosInstance from "src/axios/axiosInstance";

interface BulkAssetCreationQtyDialogProps {
  onClose: VoidFunction | any;
  currency: string;
  onSubmit: VoidFunction | any;
  productData?: object | any;
  bulkAssetCreationData?: object | any;
  bulkEdit?: boolean | any;
}

const BulkAssetCreationQtyDialog: FC<BulkAssetCreationQtyDialogProps> = ({ onClose, currency, onSubmit, productData, bulkEdit, bulkAssetCreationData }) => {

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [allFields, setAllFields] = useState([]);

  useEffect(() => {
    fetchField()
  }, []);

  const fetchField = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.bulkAssetCreationProduct}`);
    var fields = response?.data?.data;
    fields = CURReplaceByCurrencySingle(fields, bulkAssetCreationData?.currency ? bulkAssetCreationData?.currency : "USD");
    setAllFields(JSON.parse(JSON.stringify(fields)))
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
      fields.forEach((element) => {
        if (element.fieldName === "unit") {
          element.option = unitOptions;
        }
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      })
      fields = fields.filter((e: any) => !e.isUneditable && !e.disableOnEdit)
      setInitialData({
        fields: fields,
        values: { ...getObjKeys("", fields), expectedDelivery: "" },
      });
    }
    else {
      fields.filter((_f) => {
        if (["unit"].includes(_f.fieldName.toLowerCase())) {
          if (productData?.productDetail?.unit) {
            _f.option = arrayToDropwdownOption(productData?.productDetail?.unit)
          }
        }
      })
      let tempObjKeysWithValues = getObjKeysWithValues(productData, fields)
      if (!tempObjKeysWithValues["taxSchedule"] && bulkAssetCreationData["taxSchedule"]) {
        tempObjKeysWithValues["taxSchedule"] = bulkAssetCreationData["taxSchedule"]
      }
      if (!tempObjKeysWithValues["expectedDelivery"] && bulkAssetCreationData["deliveryDate"]) {
        tempObjKeysWithValues["expectedDelivery"] = bulkAssetCreationData["deliveryDate"]
      }
      setInitialData({
        fields: fields,
        values: tempObjKeysWithValues,
      });
    }
    EvaluteproductFields(fields);
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

export default BulkAssetCreationQtyDialog;
