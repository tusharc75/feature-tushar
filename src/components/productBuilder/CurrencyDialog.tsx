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

const ProductBuilderSchema = Yup.object().shape({
    currency: Yup.string()
        .required("please select currency"),
});


const CurrencyDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, handleCurrencyAdd, fieldData } = props;
    const [initialData, setInitialData] = useState({ currency: "" });
    const history = useHistory();

    const handleSubmit = (values) => {
        if (fieldData.displayCurrency.includes(values.currency)) {
            alert("Currency alreday added")
            return
        }
        handleCurrencyAdd(fieldData, values.currency)
    };

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
            validationSchema={ProductBuilderSchema}
            validateOnMount
            onSubmit={handleSubmit}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title="Add Currency" onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
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
                                </Box>
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

export default CurrencyDialog;
