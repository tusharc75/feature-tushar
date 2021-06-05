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
    name: Yup.string()
        .required("please enter name"),
});


const CreateNewDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ name: "" });
    const history = useHistory();

    const handleSubmit = (values) => {
        axiosInstance().post(`/productbuilder`, values).then(({ data: { data } }) => {
            setLoading(false);
            handleClose()
            history.push({ pathname: routes.productBuilder.path + "/" + data._id })
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        });
    };

    return (<Dialog
        maxWidth="sm"
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
                    <CustomDialogHeader title={"Create New"} onClose={handleClose}></CustomDialogHeader>
                    <CustomDialogContent>
                        <Form autoComplete="off" autoCorrect="off" noValidate >
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="Name"
                                    required={true}
                                    name="name"
                                    fullWidth
                                    margin="dense"
                                    value={values["name"]}
                                    error={touched["name"] && Boolean(errors["name"])}
                                    helperText={touched["name"] && errors["name"]}
                                    onChange={(e) => setFieldValue("name", e.target.value.trimStart())}
                                />
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
                            loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            size="small"
                            onClick={submitForm}
                        > Save</CustomButton>
                    </CustomDialogFooter>
                </Fragment>
            )}
        </Formik>
    </Dialog>
    );
}

export default CreateNewDialog;
