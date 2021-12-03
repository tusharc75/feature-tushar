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
import { dateFormatForInputControl } from '../../../constants/helpers';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { startCase } from 'lodash';
import axiosInstance from "../../../axios/axiosInstance";
import { groupBy } from 'lodash';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema } from "../../../constants/helpers";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, isFieldNotTouched } from "..//../../constants/helpers";
import { Formik, Form } from "formik";
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton'
import CustomButton from '../../../components/Helpers/CustomButton'
import { FaDiceOne } from "react-icons/fa";
import FormTypes from "../../../components/Helpers/FormTypes";
import { uniq, map, orderBy, isEqual } from 'lodash';
import { CURReplaceByCurrencySingle } from "../../../constants/formulaUtility";
import { autoCalculateSpecificFields } from "../../../constants/formulaUtility";

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

  useEffect(() => {
    axiosInstance().get("/field/child?resource=Rental Management Product").then(({ data: { data } }) => {
      data = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
      setAllFields(JSON.parse(JSON.stringify(data)))
      if (isBulkedit) {
        data.forEach((_f) => {
          _f.required = false;
          _f.isFormula = false;
          _f.isMulitFormula = false;
        })
        setInitialData({
          fields: data,
          values: { ...getObjKeys("", data), startDate: "", endDate: "" },
        });
      }
      else {
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
        editTitle = `Edit - [${rowData.detail} (${rowData.subRows.length})]`;
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
      return `${bulkEdit} (${edits.join(", ")})`;
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
          row[ele.fieldName] = sumValues[ele.fieldName] / product.length;
        }
      })
    })
  }

  const handleSubmit = (values) => {
    if (isBulkedit) {
      for (const x in values) {
        if (values[x] === 0 || values[x] === "0" || values[x] === "" || (Array.isArray(values[x]) && values[x].length === 0)) {
          delete values[x]
        }
      }
      const rows = []
      selectedProducts.forEach(element => {
        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
        rows.push({ ...element, ...calValues })
      });
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
