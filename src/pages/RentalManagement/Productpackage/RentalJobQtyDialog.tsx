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

interface EditDialogProps {
  onClose: VoidFunction | any;
  isSaving: boolean;
  submitBulkEdit: VoidFunction | any;
  rentalManagementData: any;
  data?: object | any;
  calculatePrice?: VoidFunction | any;
  endDate: any;
  startDate: any;
  selectedProducts: any[]
}

const RentalJobQtyDialog: FC<EditDialogProps> = (
  {
    calculatePrice,
    onClose,
    isSaving,
    submitBulkEdit,
    rentalManagementData,
    data,
    startDate,
    endDate,
    selectedProducts
  }) => {

  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance().get("/field/child?resource=Rental Management Product").then(({ data: { data } }) => {
      data = CURReplaceByCurrencySingle(data, rentalManagementData.currency)
      setInitialData({
        fields: data,
        values: getObjKeys("", data),
      });
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
    if (data) {
      let editTitle = `Edit - [${data.detail}]`;

      if (data.subRows && data.subRows?.length > 0) {
        editTitle = `Edit - [${data.detail} (${data.subRows.length})]`;
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

  const handleClose = () => {
    if (isSaving === false) {
      onClose();
    }
  };

  const handleSubmit = (values) => {
    console.log(values)
    submitBulkEdit({ ...data, ...values })
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
          </Fragment>
        )}
      </Formik>
      :
      <Box p={2} height={500} bgcolor="white">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </Box>}
    {
      showConfirmationDialog && <ConfirmationDialog
        open={showConfirmationDialog}
        message="Price configured at the product level will be override, would you like to override it ?"
        onOk={() => {
          setShowConfirmationDialog(false);
        }}
        onClose={() => {
          setShowConfirmationDialog(false)
        }}
      />
    }
  </Dialog>);
};

export default RentalJobQtyDialog;
