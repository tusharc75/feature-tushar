import React, { useState, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import TextField from '@material-ui/core/TextField';
import { object, string } from "yup";
import { useHistory } from "react-router-dom";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "./../../constants/helpers";

const ProductBuilderSchema = object().shape({
    name: string()
        .required("Please enter name"),
});

const CreateNewDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose } = props;
    const [loading, setLoading] = useState(false);
    const [initialData] = useState({ name: "" });
    const history = useHistory();
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const handleSubmit = (values) => {
        setLoading(true)
        values.charts = [];
        axiosInstance().post(`/dashboard`, values).then(({ data: { data } }) => {
            setLoading(false);
            handleClose()
            history.push({ pathname: "dashboard/detail/" + data._id })
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        });
    };

    return (<Dialog
        maxWidth="sm"
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <Formik
            enableReinitialize={true}
            initialValues={initialData}
            validationSchema={ProductBuilderSchema}
            onSubmit={handleSubmit}>
            {({ values,
                errors,
                touched,
                setFieldValue,
                submitForm,
            }) => (
                <Fragment>
                    <CustomDialogHeader title={"New Dashboard"} onClose={handleClose}
                        isMinimized={!fullScreen}
                        onMinimizeMaximize={() => {
                            setFullScreen(prevState => !prevState)
                        }}
                        showManimizeMaximize={true}
                    ></CustomDialogHeader>
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
                            </Box>
                            <Box p={1}>
                                <TextField
                                    variant="outlined"
                                    type="text"
                                    label="Description"
                                    name="description"
                                    fullWidth
                                    margin="dense"
                                    value={values["description"]}
                                    error={touched["description"] && Boolean(errors["description"])}
                                    helperText={touched["description"] && errors["description"]}
                                    onChange={(e) => setFieldValue("description", e.target.value)}
                                />
                            </Box>
                        </Form>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button size="small" color="primary" onClick={handleClose}>Cancel</Button>
                        <CustomButton
                            loading={loading}
                            disabled={loading}
                            variant="contained"
                            color="primary"
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
