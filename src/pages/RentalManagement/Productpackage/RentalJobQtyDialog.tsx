import { FC, useEffect, useState, Fragment, useRef } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from "../../../axios/axiosInstance";
import { groupBy } from 'lodash';
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
import { uniq, map, orderBy, isEqual } from 'lodash';
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { autoCalculateSpecificFields, handleAutoCalculation } from "../../../constants/formulaUtility";

interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  rentalManagementData: any;
  rowData?: object | any;
  calculatePrice?: VoidFunction | any;
  material: any[]
  selectedProducts: any[]
  isBulkedit: any
}

const rateChangeFields = ["unit", "pricingMethod"]

const RentalJobQtyDialog: FC<EditDialogProps> = (
  {
    calculatePrice,
    onClose,
    handleSaveData,
    rentalManagementData,
    rowData,
    material,
    selectedProducts,
    isBulkedit
  }) => {

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const ref = useRef(null);

  useEffect(() => {
    axiosInstance().get("/field/child?resource=Rental Management Product").then(({ data: { data } }) => {
      data = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
      setAllFields(JSON.parse(JSON.stringify(data)))
      if (isBulkedit) {
        let unit: any = []
        let pricingMethod: any = []
        selectedProducts?.forEach(element => {
          if (element?.[`${element.type}Detail`]?.unit) {
            unit = [...unit, ...element?.[`${element.type}Detail`].unit];
          }
          if (element?.[`${element.type}Detail`].pricingMethod) {
            pricingMethod = [...pricingMethod, ...element?.[`${element.type}Detail`].pricingMethod];
          }
        });
        const unitOptions: any = arrayToDropwdownOption(uniq(unit))
        const pricingMethodOptions: any = arrayToDropwdownOption(uniq(pricingMethod));
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
        setInitialData({
          fields: data,
          values: { ...getObjKeys("", data), startDate: "", endDate: "" },
        });
      }
      else {
        let unitOptions: any = []
        let pricingMethodOptions: any = []
        if (rowData?.[`${rowData.type}Detail`]?.unit) {
          unitOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`].unit);
        }
        if (rowData?.[`${rowData.type}Detail`].pricingMethod) {
          pricingMethodOptions = arrayToDropwdownOption(rowData?.[`${rowData.type}Detail`].pricingMethod);
        }
        data.forEach(element => {
          if (element.fieldName === "unit") {
            element.option = unitOptions;
          }
          if (element.fieldName === "pricingMethod") {
            element.option = pricingMethodOptions;
          }
        });
        setInitialData({
          fields: data,
          values: getObjKeysWithValues(rowData, data),
        });
      }
      EvaluteproductFields(data);
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

  const getTitle = () => {
    if (rowData) {
      let editTitle = `Edit - [${rowData.detail}]`;
      if (rowData.subRows && rowData.subRows?.length > 0) {
        editTitle = `Edit - [${rowData.detail}(${rowData.subRows.length})]`;
      }
      return editTitle;
    } else {
      let bulkEdit = "Bulk Edit -";
      const groupByProducts = groupBy(selectedProducts, "type");
      const edits = [];
      if (groupByProducts["Product"]) {
        edits.push(`${groupByProducts["Product"].length} - Products`)
      }
      if (groupByProducts["Package"]) {
        edits.push(`${groupByProducts["Package"].length} - Package`)
      }
      if (groupByProducts["productInPackage"]) {
        edits.push(`${groupByProducts["productInPackage"].length} - Product In Package`)
      }
      return `${bulkEdit}(${edits.join(", ")})`;
    }
  }

  const resetValueZero = (rows) => {
    const resetFields = []
    initialData.fields.forEach((element) => {
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

  const sumOnParent = (packages, product) => {
    const resetFields = []
    initialData.fields.forEach((element) => {
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
          row[ele.fieldName] = parseFloat((sumValues[ele.fieldName] / product.length).toFixed(2));
        }
      })
    })
  }

  const handleSubmit = (values) => {
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === "" || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x]
        }
      }
      let rows: any = []
      selectedProducts.forEach(element => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
        if (element.type === "product" && element.parentId === null) {
          rows.push({ ...element, ...calValues })
        }
        else if (element.type === "package") {
          rows.push({ ...element, ...calValues })
          const product = material.filter((e) => e.parentId === element._id)
          resetValueZero(product)
          rows = [...rows, ...product]
        }
      });
      //Code for Bulk Update Only Product in Packages
      let packageProducts = selectedProducts.filter((ele) => ele.parentId !== null && !selectedProducts.some(f => f._id === ele.parentId));
      if (packageProducts.length) {
        const packageIds = uniq(map(packageProducts, 'parentId'))
        console.log(packageIds)
        packageIds.forEach((_packageId) => {
          const packages: any = material.filter((e) => e._id === _packageId)
          const product: any = material.filter((e) => e.parentId === _packageId)
          product.forEach((element) => {
            if (packageProducts.filter((e) => element._id === e._id).length) {
              const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
              rows.push({ ...element, ...calValues })
              for (var key in calValues) {
                element[key] = calValues[key];
              }
            }
          })
          sumOnParent(packages, product)
          rows = [...rows, ...packages]
        })
      }
      handleSaveData(rows)
    }
    else {
      if (rowData.type === "package" && !showConfirmationDialog) {
        setShowConfirmationDialog(true);
      }
      else {
        let rows: any = [{ ...rowData, ...values }]
        if (rowData.type === "package") {
          const product = material.filter((e) => e.parentId === rowData._id)
          resetValueZero(product)
          rows = [...rows, ...product]
        }
        else if (rowData.type === "product" && rowData.parentId) {
          const packages: any = material.filter((e) => e._id === rowData.parentId)
          const product: any = material.filter((e) => e.parentId === rowData.parentId)
          product.forEach((element) => {
            if (element._id === rowData._id) {
              for (var key in values) {
                element[key] = values[key];
              }
            }
          })
          sumOnParent(packages, product)
          rows = [...rows, ...packages]
        }
        handleSaveData(rows)
        setShowConfirmationDialog(false);
      }
    }
  };

  const getPricing = async (values: any) => {
    if (rowData) {
      if (values?.qty > 0 && values?.pricingMethod !== '' && values?.unit !== '') {
        const priceData = await calculatePrice([{
          materialId: rowData.materialId,
          type: rowData.type,
          qty: values.qty,
          pricingMethod: values.pricingMethod,
          unit: values.unit
        }]);
        if (priceData && priceData.length && priceData[0].mrp) {
          let price: any = priceData[0].mrp;
          return price;
        }
        return 0;
      }
      else {
        return 0;
      }
    }
  };

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
                                      options={field.option}
                                      setFieldValue={(name, value) => {
                                        setFieldValue(name, value)
                                      }}
                                      onChange={(e, val) => {
                                        const value = val && val.optionValue ? val.optionValue : '';
                                        getPricing({ ...values, [field.fieldName]: value }).then((price: any) => {
                                          if (price) {
                                            let priceFieldName = "price_" + rentalManagementData?.currency?.toLowerCase()
                                            const result = autoCalculateSpecificFields({ [priceFieldName]: price, [field.fieldName]: value }, values, initialData.fields)
                                            if (Object.keys(result).length >= 1) {
                                              for (var x in result) {
                                                setFieldValue(x, result[x]);
                                              }
                                            }
                                          }
                                          else {
                                            const result = handleAutoCalculation(field, initialData.fields, values, field.fieldName, '', '', value);
                                            if (Object.keys(result).length >= 1) {
                                              for (var x in result) {
                                                setFieldValue(x, result[x]);
                                              }
                                            }
                                          }
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
                disabled={isEqual(ref?.current?.values, initialData.values)}
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
                message="Price configured at the product level will be override, would you like to override it ?"
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
