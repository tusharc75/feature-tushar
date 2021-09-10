import { useState, useContext, useEffect } from "react";
import {
    Box,
    Grid,
    Button,
    TextField,
    CircularProgress,
    Dialog,
    InputAdornment,
} from "@material-ui/core";
import { TextField as TextFieldFormik } from "formik-material-ui";
import { Formik, Form, Field } from "formik";
import { KeyboardDatePicker } from "formik-material-ui-pickers";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import { object, string } from "yup";
import moment from "moment";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import { CustomDialogTransition, dateFormat, rentalManagement } from "../../constants/helpers";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import Loader from "../../components/Loader";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";


const TaskSchema = object().shape({
    costPerDay: string().required("Please enter cost per day"),
    startDate: string().required("Please enter start date"),
    dueDate: string().required("Please enter due date"),
});

export const AddRentalCostDialog = ({ RentalCostData, onClose, onSuccess, currencySymbol, open, rentalId }) => {
    const toastConfig = useContext(CustomToastContext);
    const [initialValues, setInitialValues] = useState(null);
    const [isSubmitting, setSubmitting] = useState(false);

    useEffect(() => {
        setInitialValues({
            costPerDay: RentalCostData.costing.costPerDay ? RentalCostData.costing.costPerDay : 0,
            totalCost: RentalCostData.costing.totalCost ? RentalCostData.costing.totalCost : 0,
            startDate: RentalCostData.costing.startDate ? new Date(RentalCostData.costing.startDate) : new Date(),
            dueDate: RentalCostData.costing.dueDate ? new Date(RentalCostData.costing.dueDate) : new Date(),
        });
    }, [RentalCostData]);

    const handleSave = (values) => {
        setSubmitting(true);
        values.costPerDay = parseInt(values.costPerDay)
        values.totalCost = parseInt(values.totalCost)
        values.dueDate = moment(values.dueDate).format(dateFormat)
        values.startDate = moment(values.startDate).format(dateFormat)
        axiosInstance().put(`${rentalManagement.rentalManagementApi}/${rentalId}/inventory/${RentalCostData.inventory._id}`, { "costing": values })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                setSubmitting(false);
                setInitialValues(null)
                onSuccess()
            }).catch((error) => {
                setSubmitting(false);
                toastConfig.setToastConfig(error)
            });
    };

    function validate(values) {
        const errors = {};
        if (moment(values.startDate) > moment(values.dueDate)) {
            errors["dueDate"] = "Due date must greater then start date";
        }
        return errors;
    }
    
  const calculateTotalCost = (setValue, cPD, startDate, endDate) => {
      const dateDiff = new Date(endDate).getDate() - new Date(startDate).getDate();
      const tCost = dateDiff > 0 ? cPD * dateDiff : cPD
      setValue("totalCost", tCost)
    }

    return (
        <Dialog
            maxWidth="sm"
            fullWidth
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            onClose={onClose}
            open={open}
        >
            <CustomDialogHeader
                title={`Add Rental Cost`}
                onClose={() => {
                    onClose()
                }}
            ></CustomDialogHeader>
            {true ? (
                <Formik
                    initialValues={initialValues}
                    validationSchema={TaskSchema}
                    onSubmit={handleSave}
                    validate={validate}
                >
                    {({ submitForm, touched, errors, setFieldValue, values }) => (
                        <>
                            <CustomDialogContent>
                                <Form autoComplete="off" autoCorrect="off" noValidate>
                                    <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                    <Box padding={1}>
                                        <MuiPickersUtilsProvider utils={MomentUtils}>
                                            <Grid container spacing={3}>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        variant="outlined"
                                                        type="number"
                                                        InputProps={{
                                                          startAdornment: (
                                                            <InputAdornment position="start">
                                                              {currencySymbol ? currencySymbol : ""}
                                                            </InputAdornment>
                                                          ),
                                                        }}
                                                        label="Cost Per Day"
                                                        required={true}
                                                        name="costPerDay"
                                                        fullWidth
                                                        margin="dense"
                                                        value={values["costPerDay"]}
                                                        error={touched["costPerDay"] && Boolean(errors["costPerDay"])}
                                                        helperText={touched["costPerDay"] && errors["costPerDay"]}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setFieldValue("costPerDay", val)
                                                            calculateTotalCost(setFieldValue, val, values?.startDate, values?.dueDate)
                                                          }
                                                        }
                                                    />
                                                    <Box pt={1}>
                                                        <Grid container spacing={1}>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                <Field
                                                                  disablePast
                                                                  component={KeyboardDatePicker}
                                                                  label="Start Date"
                                                                  name="startDate"
                                                                  autoOk
                                                                  variant="inline"
                                                                  inputVariant="outlined"
                                                                  fullWidth
                                                                  margin="dense"
                                                                  format={dateFormat}
                                                                  onChange={(date) => {
                                                                    setFieldValue("startDate", date._d)
                                                                    calculateTotalCost(setFieldValue, values?.costPerDate, date._d, values?.dueDate)

                                                                  }}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                <Field
                                                                    component={KeyboardDatePicker}
                                                                    label="Due Date"
                                                                    name="dueDate"
                                                                    autoOk
                                                                    variant="inline"
                                                                    inputVariant="outlined"
                                                                    fullWidth
                                                                    margin="dense"
                                                                    minDate={values.startDate}
                                                                    format={dateFormat}
                                                                    onChange={(date) => {
                                                                      setFieldValue("dueDate", date._d)
                                                                      calculateTotalCost(setFieldValue, values?.costPerDay, values?.startDate, date._d)
                                                                    }}
                                                                />
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                    <Box pt={1}>
                                                        <Field
                                                          component={TextFieldFormik}
                                                          disabled={true}
                                                          fullWidth
                                                          InputProps={{
                                                            startAdornment: (
                                                              <InputAdornment position="start">
                                                                {currencySymbol ? currencySymbol : ""}
                                                              </InputAdornment>
                                                            ),
                                                          }}
                                                          margin="dense"
                                                          type="number"
                                                          label="Total Cost"
                                                          name="totalCost"
                                                          variant="outlined"
                                                        />
                                                    </Box>
                                                </Grid>

                                            </Grid>
                                        </MuiPickersUtilsProvider>
                                    </Box>
                                </Form>
                            </CustomDialogContent>
                            <CustomDialogFooter>
                                <Button
                                    disabled={isSubmitting}
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                        onClose()
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={isSubmitting}
                                    type="button"
                                    color="primary"
                                    size="small"
                                    variant="contained"
                                    onClick={submitForm}
                                >
                                    {isSubmitting ? <CircularProgress size={22} /> : "Save"}
                                </Button>
                            </CustomDialogFooter>
                        </>
                    )}
                </Formik>
            ) : (
                <CustomDialogContent>
                    <Loader minHeight="500px" text="Loading..." />
                </CustomDialogContent>
            )}
        </Dialog>);
};

