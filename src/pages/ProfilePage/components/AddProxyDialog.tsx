import { useContext, useState, useEffect } from 'react'
import {
    Dialog,
    Grid,
    Button,
    TextField,
    CircularProgress
} from "@material-ui/core";
import { CustomDialogTransition } from '../../../constants/helpers'
import { isMobile, isTablet } from "react-device-detect";
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { object, string } from "yup";
import { Formik, Form } from "formik";
import { Autocomplete } from "@material-ui/lab";
import {
    MuiPickersUtilsProvider,
    KeyboardDatePicker,
} from "@material-ui/pickers";
import { dateFormat } from "../../../constants/helpers";
import MomentUtils from "@date-io/moment";

const AddProxySchema = object().shape({
    user: string().required("Please select user"),
    startDate: string().required("Please enter start date").nullable(),
    endDate: string().required("Please enter end date").nullable(),
});

export default function AddProxyDialog({ open, onClose, onSuccess, userId }) {

    const toastConfig = useContext(CustomToastContext);
    const [userList, setUserList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialValues] = useState({
        user: "",
        startDate: new Date(),
        endDate: null
    });

    useEffect(() => {
        fetchUsers();
    }, [])

    const fetchUsers = () => {
        axiosInstance().get("/user")
            .then(({ data: { data } }) => {
                setUserList(data.filter(d => d._id !== userId));
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    function validate(values) {
        const errors = {};

        if (!values.user) {
            errors["user"] = "Please select user";
        }

        if (
            new Date(values.startTime).getTime() >= new Date(values.endTime).getTime()
        ) {
            errors["endTime"] = "End time should be different";
        }

        if (
            new Date(values.startDate).getTime() > new Date(values.endDate).getTime()
        ) {
            errors["endDate"] = "End date should be greater then start date";
        }

        return errors;
    }

    const handleSave = (values) => {
        setIsSubmitting(true);
        onSuccess(values)
    }

    return (
        <>
            <Formik
                initialValues={initialValues}
                validationSchema={AddProxySchema}
                onSubmit={handleSave}
                validate={validate}
            >
                {({ submitForm, touched, errors, setFieldValue, values }) => (
                    <>
                        <Dialog
                            fullScreen={isMobile || isTablet}
                            TransitionComponent={CustomDialogTransition}
                            open={open}
                            aria-labelledby="customized-dialog-title"
                            maxWidth={"sm"}
                            onClose={onClose}
                            fullWidth
                        >
                            <CustomDialogHeader title="Add DOA Proxy" />

                            <CustomDialogContent>
                                <Form autoComplete="off" autoCorrect="off" noValidate>
                                    <MuiPickersUtilsProvider utils={MomentUtils}>
                                        <Grid
                                            container
                                            spacing={2}
                                            direction="row"
                                            justify="flex-start"
                                            alignItems="center"
                                        >
                                            <Grid item md={12} sm={12} xs={12}>
                                                <Autocomplete
                                                    id="combo-box-demo"
                                                    size="small"
                                                    value={
                                                        userList.filter((data) => data._id === values.user)
                                                            .length
                                                            ? userList.find((data) => data._id === values.user)
                                                            : ""
                                                    }
                                                    options={userList}
                                                    getOptionLabel={(option: any) => option.concatedName}
                                                    onChange={(event, newValue: any) => {
                                                        setFieldValue("user", newValue._id);
                                                    }}
                                                    getOptionSelected={(option: any, val) => option._id === val}
                                                    renderInput={(params) => <TextField
                                                        {...params}
                                                        label="Select User"
                                                        variant="outlined"
                                                        name="nameField"
                                                        error={touched["user"] && Boolean(errors["user"])}
                                                        helperText={touched["user"] && errors["user"]}
                                                        required
                                                    />}
                                                />
                                            </Grid>

                                            <Grid item md={12} sm={12} xs={12}>
                                                <KeyboardDatePicker
                                                    autoOk
                                                    size="small"
                                                    disablePast
                                                    variant="inline"
                                                    inputVariant="outlined"
                                                    value={values.startDate}
                                                    name="startDate"
                                                    label="Start Date"
                                                    required
                                                    fullWidth
                                                    placeholder={dateFormat}
                                                    onChange={(date: any) => {
                                                        setFieldValue("startDate", date);
                                                    }}
                                                    format={dateFormat}
                                                    error={
                                                        Boolean(touched["startDate"]) &&
                                                        Boolean(errors["startDate"])
                                                    }
                                                    helperText={
                                                        Boolean(touched["startDate"]) && errors["startDate"]
                                                    }
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    margin="dense"
                                                />
                                            </Grid>

                                            <Grid item md={12} sm={12} xs={12}>
                                                <KeyboardDatePicker
                                                    autoOk
                                                    size="small"
                                                    disablePast
                                                    variant="inline"
                                                    inputVariant="outlined"
                                                    minDate={values.startDate}
                                                    value={values.endDate}
                                                    name="endDate"
                                                    label="End Date"
                                                    required
                                                    fullWidth
                                                    placeholder={dateFormat}
                                                    onChange={(date: any) => {
                                                        setFieldValue("endDate", date);
                                                    }}
                                                    format={dateFormat}
                                                    error={
                                                        Boolean(touched["endDate"]) &&
                                                        Boolean(errors["endDate"])
                                                    }
                                                    helperText={
                                                        Boolean(touched["endDate"]) && errors["endDate"]
                                                    }
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    margin="dense"
                                                />
                                            </Grid>

                                        </Grid>


                                    </MuiPickersUtilsProvider>
                                </Form>
                            </CustomDialogContent>

                            <CustomDialogFooter>
                                <Button
                                    size="small"
                                    onClick={onClose}
                                    variant="contained"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={isSubmitting}
                                    type="button"
                                    color="primary"
                                    variant="contained"
                                    size="small"
                                    onClick={submitForm}
                                >
                                    {isSubmitting ? <CircularProgress size={22} /> : "Save"}
                                </Button>
                            </CustomDialogFooter>

                        </Dialog>
                    </>
                )}

            </Formik>
        </>
    )
}
