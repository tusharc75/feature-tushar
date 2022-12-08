import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from "../../../axios/axiosInstance";
import { groupBy, uniqBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, arrayToDropwdownOption } from "..//../../constants/helpers";
import { Formik, Form } from "formik";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomButton from '../../../components/Helpers/CustomButton'
import { FaDiceOne } from "react-icons/fa";
import FormTypes from "../../../components/Helpers/FormTypes";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog";
import { uniq, map, orderBy, isEqual, intersection } from 'lodash';
import { autoCalculateSpecificFields, handleAutoCalculation } from "../../../constants/formulaUtility";
import moment from "moment";
import { calculatePrice, fetch_rental_product_fields } from '../../../components/RentalManagment/helper';
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";
import { object, number } from 'yup';

interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  rentalManagementData: any;
  rowData?: object | any;
  material: any[]
  selectedProducts: any[]
  isBulkedit: any
  loading: any
  from?: any
  isQtyOnly?: Boolean
}

export const resetValueZero = (rows, allFields) => {
  const resetFields = []
  allFields.forEach((element) => {
    if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
      if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
        element.displayUnits.forEach((_unit) => {
          resetFields.push(element.fieldName + "_" + _unit.toLowerCase())
        })
      }
      else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
        element.displayUnits.forEach((_unit) => {
          element.displayCurrency.forEach((_currency) => {
            resetFields.push(element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase())
          })
        })
      }
      else if (element.type === "currencyAmount") {
        element.displayCurrency.forEach((_currency) => {
          resetFields.push(element.fieldName + "_" + _currency.toLowerCase())
        })
      }
    }
    else if (element.type === "percent") {
      resetFields.push(element.fieldName)
    }
  })
  rows.forEach((row) => {
    resetFields.forEach((fieldName) => {
      row[fieldName] = 0;
    })
  })
}

export const sumOnParent = (packages, product, allFields, currency) => {
  const resetFields = []
  allFields.forEach((element) => {
    if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
      if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
        element.displayUnits.forEach((_unit) => {
          resetFields.push({ fieldName: element.fieldName + "_" + _unit.toLowerCase(), type: "amount" })
        })
      }
      else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
        element.displayUnits.forEach((_unit) => {
          element.displayCurrency.forEach((_currency) => {
            resetFields.push({ fieldName: element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase(), type: "amount" })
          })
        })
      }
      else if (element.type === "currencyAmount") {
        element.displayCurrency.forEach((_currency) => {
          resetFields.push({ fieldName: element.fieldName + "_" + _currency.toLowerCase(), type: "amount" })
        })
      }
    }
    else if (element.type === "percent") {
      resetFields.push({ fieldName: element.fieldName, type: "percent" })
    }
  })
  const sumValues: any = {}
  resetFields.forEach((_field: any) => {
    sumValues[_field.fieldName] = 0;
    product.forEach(element => {
      sumValues[_field.fieldName] += element[_field.fieldName] ? element[_field.fieldName] : 0;
    });
  });
  packages.forEach((row) => {
    resetFields.forEach((ele) => {
      if (ele.type === "amount") {
        row[ele.fieldName] = sumValues[ele.fieldName];
      }
      else {
        if (ele.fieldName === "discountPercentage") {
          row[ele.fieldName] = parseFloat(((sumValues[`discount_${currency}`] / sumValues[`totalPrice_${currency}`]) * 100)?.toFixed(2));
        }
        if (ele.fieldName === "taxPercentage") {
          row[ele.fieldName] = parseFloat(((sumValues[`tax_${currency}`] / (sumValues[`totalPrice_${currency}`] - sumValues[`discount_${currency}`])) * 100)?.toFixed(2));
        }
      }
    })
  })
}

const rateChangeFields = ["unit", "pricingMethod", "pricingCondition"]

const RentalJobQtyDialog: FC<EditDialogProps> = (
  {
    onClose,
    handleSaveData,
    rentalManagementData,
    rowData,
    material,
    selectedProducts,
    isBulkedit,
    loading,
    isQtyOnly = false,
    from
  }) => {

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [priceConditionList, setPriceConditionList] = useState([]);
  const [priceConditionListConst, setPriceConditionListConst] = useState([]);
  const [priceMethodList, setPriceMethodList] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const ref = useRef(null);
  const { isOffline } = useContext(CustomOfflineContext);
  useEffect(() => {
    fetchData()
  }, []);

  const fetchData = async () => {
    var { fields: data } = await fetch_rental_product_fields(rentalManagementData?.currency, isOffline);
    setAllFields(JSON.parse(JSON.stringify(data)))
    if (isBulkedit) {
      let unitArray: any = []
      let pricingMethodArray: any = []
      selectedProducts?.forEach(element => {
        if (element?.[`${element.type}Detail`]?.unit) {
          unitArray.push([...element?.[`${element?.type}Detail`]?.unit])
        }
        if (element?.[`${element.type}Detail`]?.pricingMethod) {
          pricingMethodArray.push([...element?.[`${element?.type}Detail`]?.pricingMethod])
        }
      });
      let unit: any = unitArray?.shift()?.filter(function (v) {
        return unitArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      let pricingMethod: any = pricingMethodArray?.shift()?.filter(function (v) {
        return pricingMethodArray?.every(function (a) {
          return a.indexOf(v) !== -1;
        });
      });
      const unitOptions: any = arrayToDropwdownOption(unit)
      const pricingMethodOptions: any = arrayToDropwdownOption(pricingMethod);

      data.forEach((element) => {
        if (element.fieldName === "unit") {
          element.option = unitOptions;
        }
        if (element.fieldName === "pricingMethod") {
          element.option = pricingMethodOptions;
        }
        
        
        element.required = false;
        element.isFormula = false;
        element.isMulitFormula = false;
      })
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit)
      setInitialData({
        fields: data,
        values: { ...getObjKeys("", data), estimateStartDate: "", estimateEndDate: "", actualStartDate: "", actualEndDate: "", estimateJobDuration: "", actualJobDuration: "" }
      });
    }
    else {
      let unitOptions: any = []
      let pricingMethodOptions: any = []
      if (rowData?.[`${rowData.type}Detail`]?.unit) {
        unitOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`].unit);
      }
      if (rowData?.[`${rowData.type}Detail`]?.pricingMethod) {
        pricingMethodOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`]?.pricingMethod);
      }
      setPriceMethodList(pricingMethodOptions)
      let pricingConditionOptions = await getPricing(rowData, pricingMethodOptions)
      data.forEach(element => {
        if (element.fieldName === "unit") {
          element.option = unitOptions;
        }
        if (element.fieldName === "pricingMethod") {
          element.option = pricingMethodOptions;
        }
        if (element.fieldName === "pricingCondition") {
          element.option = pricingConditionOptions;
        }
        // if (element.fieldName === "qty" && rowData?.serializedProduct === false && rowData?.hideSelection) {
        //   element.isUneditable = true;
        // }
      });
      if (rowData?.actualStartDate === "" || rowData?.actualStartDate === "") {
        data = data.filter((e) => !["actualStartDate", "actualEndDate", "actualJobDuration"].includes(e.fieldName))
      }

      let initialValues = getObjKeysWithValues(rowData, data)
      const priceFieldName = "price_" + rentalManagementData?.currency?.toLowerCase();

      if(rowData[priceFieldName]) {
        getPricing({ ...initialValues, [priceFieldName]: rowData[priceFieldName] }).then((price: any) => {
          const result = autoCalculateSpecificFields({ [priceFieldName]: price, [priceFieldName]: rowData[priceFieldName] }, initialValues, data)
          initialValues = {...initialValues, ...result}
          setInitialData({
            fields: data,
            values: initialValues
          });
       })
     } else {
       setInitialData({
         fields: data,
         values: initialValues
       });
     }
    // setInitialData({
    //        fields: data,
    //        values: initialValues
    //      });

    }
    EvaluteproductFields(data);
  }

  const EvaluteproductFields = (fields) => {
    if (isQtyOnly) {
      fields = fields.filter(d => d.fieldName === "qty")
    }
    if (isBulkedit && (from === "product" || from === "service")) {
      fields = fields.filter(d => d.fieldName !== "pricingCondition" && d.fieldName !== "pricingMethod")
    }
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData)
  }

  const getTitle = () => {
    if (rowData) {
      let editTitle = `Edit - ${rowData.detail}`;
      if (rowData.subRows && rowData.subRows?.length > 0) {
        editTitle = `Edit - ${rowData.detail}`;
      }
      return editTitle;
    } else {
      return "Bulk Edit";
    }
  }

  const handleSubmit = async (values) => {
    const currency = rentalManagementData?.currency?.toLowerCase();
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === "" || (Array.isArray(values[x]) && values[x].length === 0) || values[x] === 0) {
          delete values[x]
        }
      }
      let rows: any = []
      let priceData: any = []
      const priceFieldName = `price_${rentalManagementData?.currency?.toLowerCase()}`
      const fieldAll: any = allFields.filter((e) => !["actualStartDate", "actualEndDate", "actualJobDuration"].includes(e.fieldName))

      if ((values["unit"] || values["pricingMethod"]) && !values[priceFieldName]) {
        const material: any = [];
        selectedProducts.forEach(d => {
          const element: any = {};
          element.materialId = d.materialId;
          element.type = d.type;
          element.unit = values["unit"] || d.unit;
          element.pricingMethod = values["pricingMethod"] || d.pricingMethod;
          element.qty = d.qty;
          material.push(element);
        });
        priceData = await calculatePrice(rentalManagementData, material);
      }

      selectedProducts.forEach(element => {

        const rateResult = priceData?.filter((e) => e.materialId === element.materialId &&
          e.materialType === element.type && e.unit === (values["unit"] || element.unit) && e.pricingMethod === (values["pricingMethod"] || element.pricingMethod))

        const tempRate = {}
        if (rateResult.length && rateResult[0].mrp) {
          tempRate[priceFieldName] = rateResult[0].mrp;
        }

        const calValues = autoCalculateSpecificFields(values, { ...element, ...values, ...tempRate }, fieldAll)
        rows.push({ ...element, ...calValues })

        if (element.parentId) {
          const parent: any = material.filter((e) => e._id === element.parentId)
          const sameParent: any = material.filter((e) => e.parentId === element.parentId)
          sameParent.forEach((element) => {
            if (element._id === element._id) {
              for (var key in values) {
                element[key] = values[key];
              }
            }
          })

          sumOnParent(parent, sameParent, allFields, currency)
          rows = [...rows, ...parent]
        }

      });

      //Code for Bulk Update Only Product in Packages
      let packageProducts = selectedProducts.filter((ele) => ele.parentId !== null && !selectedProducts.some(f => f._id === ele.parentId));
      if (packageProducts.length) {
        const packageIds = uniq(map(packageProducts, 'parentId'))
        packageIds.forEach((_packageId) => {
          const packages: any = material.filter((e) => e._id === _packageId)
          const product: any = material.filter((e) => e.parentId === _packageId)
          product.forEach((element) => {
            if (packageProducts.filter((e) => element._id === e._id).length) {
              const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, fieldAll)
              rows.push({ ...element, ...calValues })
              for (var key in calValues) {
                element[key] = calValues[key];
              }
            }
          })
          sumOnParent(packages, product, allFields, currency)
          rows = [...rows, ...packages]
        })
      }
      handleSaveData(rows)
    }
    else {
      if (rowData.parentId && !showConfirmationDialog) {
        setShowConfirmationDialog(true);
      }
      else {
        let rows: any = [{ ...rowData, ...values }]
        if (rowData.type === "package") {
          const product = material.filter((e) => e.parentId === rowData._id)
          resetValueZero(product, allFields)
          rows = [...rows, ...product]
        }
        else if (rowData.type === "product" && rowData.parentId) {
          if (values[`totalPrice_${currency}`] !== rowData[`totalPrice_${currency}`]) {
            const packages: any = material.filter((e) => e._id === rowData.parentId)
            const product: any = material.filter((e) => e.parentId === rowData.parentId)
            product.forEach((element) => {
              if (element._id === rowData._id) {
                for (var key in values) {
                  element[key] = values[key];
                }
              }
            })
            sumOnParent(packages, product, allFields, currency)
            rows = [...rows, ...packages]
          }
        }
        handleSaveData(rows)
        setShowConfirmationDialog(false);
      }
    }
  };

  async function getPricing(values: any, pricingMethodOptions: any = null) {
    if (rowData) {
      if (values?.qty > 0 && values?.pricingMethod !== '' && values?.unit !== '') {
        const priceData: any = await calculatePrice(rentalManagementData, [{
          materialId: rowData.materialId,
          type: rowData.type,
          qty: values.qty,
          pricingMethod: pricingMethodOptions ? pricingMethodOptions.map(d => d.optionLabel).join() : values?.pricingMethod,
          unit: values.unit
        }]);
        let tempPriceData = priceData.filter(d => d.mrp !== undefined && d.mrp !== null && d.mrp !== 0)
        setPriceConditionList(uniqBy(tempPriceData.map(d => {
          return {
            "optionLabel": d?.conditionName,
            "optionValue": d?.conditionId,
          }
        }), 'optionValue'))
        if (pricingMethodOptions) {
          setPriceConditionListConst(tempPriceData)
          return uniqBy(tempPriceData.map(d => {
            return {
              "optionLabel": d?.conditionName,
              "optionValue": d?.conditionId,
            }
          }), 'optionValue')
        }
        if (priceData && priceData.length) {
          let pricingConditionIndex = priceData.findIndex(d => d?.conditionId === values?.pricingCondition)
          let price: any = pricingConditionIndex > -1 ? priceData[pricingConditionIndex]?.mrp : 0;
          return price;
        }
        return 0;
      }
      else {
        return 0;
      }
    }
  };


  function validate(values) {
    const errors = {};
    let estimateStartDate = moment(values?.estimateStartDate);
    let estimateEndDate = moment(values?.estimateEndDate);
    if (estimateEndDate.diff(estimateStartDate, 'days') < 0) {
      errors['estimateEndDate'] = 'Please enter valid estimate end date';
    }
    if (rowData && rowData.hideSelection) {
      if (rowData.parentId) {
        const _package = material?.filter((e) => e._id === rowData.parentId);
        if (_package.length) {
          if ((values.qty * _package[0].qty) < rowData.assetQty) {
            errors['qty'] = 'The quantity is less than what was assigned.';
          }
        }
      }
      else {
        if (values.qty < rowData.assetQty) {
          errors['qty'] = 'The quantity is less than what was assigned.';
        }
      }
    }
    if (isQtyOnly && rowData && values.qty > rowData.qty) {
      errors['qty'] = `Quantity can not be greater than ${rowData?.qty}`;
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
        innerRef={ref}
        enableReinitialize={true}
        initialValues={initialData.values}
        validationSchema={yupSchema(initialData.fields)}
        validateOnMount
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
              title={getTitle()}
              onClose={() => {
                if (!isEqual(ref?.current?.values, initialData.values)) {
                  setShowConfirmDialog(true)
                }
                else {
                  onClose()
                }
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              {isBulkedit && <h6 className="form-label-style mb-2" >* Please enter value you want to bulk update.</h6>}
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
                            (rateChangeFields.includes(field.fieldName) && !isBulkedit) ?
                              <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                <Box display="flex" >
                                  <Box flexGrow={1}  >
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
                                      options={field.fieldName === "pricingMethod" && priceConditionList && values["pricingCondition"] ? priceMethodList : field.fieldName === "pricingCondition" && values["pricingMethod"] ? priceConditionList : field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value)
                                      }}
                                      onChange={(e, val) => {
                                        const value = val && val.optionValue ? val.optionValue : '';
                                        if (field.fieldName === "pricingCondition") {
                                          setFieldValue("pricingMethod", "");
                                          setPriceMethodList(priceConditionListConst.filter(d => d.conditionId === value).map(d => {
                                            return {
                                              "optionLabel": d?.pricingMethod,
                                              "optionValue": d?.pricingMethod
                                            }
                                          }))
                                        }
                                        getPricing({ ...values, [field.fieldName]: value }).then((price: any) => {
                                          // if (price) {
                                          let priceFieldName = "price_" + rentalManagementData?.currency?.toLowerCase()
                                          const result = autoCalculateSpecificFields({ [priceFieldName]: price, [field.fieldName]: value }, values, initialData.fields)
                                          if (Object.keys(result).length >= 1) {
                                            for (var x in result) {
                                              setFieldValue(x, result[x]);
                                            }
                                          }
                                          // }
                                          // else {
                                          //   const result = handleAutoCalculation(field, initialData.fields, values, field.fieldName, '', '', value);
                                          //   if (Object.keys(result).length >= 1) {
                                          //     for (var x in result) {
                                          //       setFieldValue(x, result[x]);
                                          //     }
                                          //   }
                                          // }
                                        });
                                      }}
                                      required={field.required}
                                      fullWidth
                                      isTooltip={field.isTooltip}
                                      tooltipMessage={field.tooltipMessage}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                              </Grid>
                              :
                              ["estimateStartDate", "estimateEndDate"].includes(field.fieldName) ?
                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                  <Box display="flex" >
                                    <Box flexGrow={1}  >
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
                                        minDate={rentalManagementData?.estimateStartDate}
                                        maxDate={rentalManagementData?.estimateEndDate}
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                                : <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                  <Box display="flex" >
                                    <Box flexGrow={1}  >
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
              <Button
                size="small"
                color="primary"
                onClick={() => {
                  if (!isEqual(ref.current.values, initialData.values)) {
                    setShowConfirmDialog(true)
                  }
                  else {
                    onClose()
                  }
                }}
              >{"Close"}</Button>
              <CustomButton
                loading={loading}
                disabled={loading || (isQtyOnly ? false : isEqual(ref?.current?.values, initialData.values))}
                variant="contained"
                color="primary"
                type="submit"
                onClick={submitForm}
              > Save
              </CustomButton>
            </CustomDialogFooter>
            {
              showConfirmationDialog && <ConfirmationDialog
                open={showConfirmationDialog}
                message="Would you prefer to override the product-level price configuration?"
                onOk={() => {
                  submitForm()
                }}
                onClose={() => {
                  setShowConfirmationDialog(false)
                }}
              />
            }
            {
              showConfirmDialog ?
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false)
                    submitForm()
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false)
                    onClose()
                  }}
                /> : null
            }
          </Fragment>
        )}
      </Formik>
      :
      <Box p={2} height={500} bgcolor="white">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>}
  </Dialog>);
};

export default RentalJobQtyDialog;
