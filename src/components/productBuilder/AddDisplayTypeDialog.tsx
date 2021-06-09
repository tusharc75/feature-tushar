import React, { useRef, useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Formik, Form, Field } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";
import FormTypes from "../../components/Helpers/FormTypes";


const AddDisplayTypeDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { displayType, handleClose, handleAddDisplayType, fieldData } = props;
    const [initialData, setInitialData] = useState({ currency: "", unit: "" });
    const history = useHistory();

    const handleSubmit = (values) => {
        let displayValue = ""
        if (displayType === "currency") {
            displayValue = values.currency
        }
        else if (displayType === "converter") {
            displayValue = values.unit
        }
        handleAddDisplayType(displayType, fieldData, displayValue)
    };

    function validate(values) {
        const errors = {};
        if (displayType === "currency") {
            if (!values.currency || values.currency === "") {
                errors["currency"] = "please select currency";
            }
            else {
                if (fieldData.displayCurrency.includes(values.currency)) {
                    errors["currency"] = "currency alreday added";
                }
            }
        }
        else if (displayType === "converter") {
            if (!values.unit || values.unit === "") {
                errors["unit"] = "please select unit";
            }
            else {
                if (fieldData.displayUnits.includes(values.unit)) {
                    errors["unit"] = "unit alreday added";
                }
            }
        }
        return errors;
    }


    return (<Dialog
        maxWidth="xs"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <Formik
            enableReinitialize={true}
            initialValues={initialData}
            validateOnMount
            onSubmit={handleSubmit}
            validate={validate}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title={displayType === "currency" ? "Add Currency" : "Add Converter Unit"} onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
                                {displayType === "currency" &&
                                    <Box mt={2}>
                                        <FormTypes
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={"Currency"}
                                            name="currency"
                                            type="currency"
                                            setFieldValue={setFieldValue}
                                            required={true}
                                            fullWidth
                                            isTooltip={false}
                                            tooltipMessage={""}
                                            size="small"
                                        />
                                    </Box>}
                                {displayType === "converter" &&
                                    <Box mt={2}>
                                        <FormTypes
                                            values={values}
                                            errors={errors}
                                            touched={touched}
                                            label={"Unit"}
                                            name="unit"
                                            type="dropDown"
                                            options={fieldData.units &&
                                                (fieldData.units.filter((_u) => !fieldData.displayUnits.includes(_u))).map((_unit) => ({ optionLabel: _unit, optionValue: _unit }))}
                                            setFieldValue={setFieldValue}
                                            required={true}
                                            fullWidth
                                            isTooltip={false}
                                            tooltipMessage={""}
                                            size="small"
                                        />
                                    </Box>}
                            </Box>
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
                        <CustomButton
                            variant="contained"
                            color="primary"
                            type="submit"
                            size="small"
                            onClick={submitForm}
                        > Add</CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default AddDisplayTypeDialog;
