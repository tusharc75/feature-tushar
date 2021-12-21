import { useState } from "react";
import {
    Box,
    Button,
    TextField,
    CircularProgress,
} from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { Formik, Form } from "formik";
import { isMobile, isTablet } from 'react-device-detect';
import { object } from "yup";
import CustomDialogHeader from "../../components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../components/CustomDialog/CustomDialogFooter";
import Dialog from "@material-ui/core/Dialog"

const ReportsToContact = object().shape({
    addContact: object().required("Please select add contact ").nullable(),
    reportsToContact: object().required("Please select reports to contact").nullable(),
});

export default function AddReportsToContact({ open, isSubmitting, onClose,
    contactsList, onSubmit }) {
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const reportsToOption =
        [...new Map(contactsList?.filter(o => Boolean(o.isExclude)).map(item =>
            [item['_id'], item])).values()];
    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            fullScreen={fullScreen || (isMobile || isTablet)}
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    onClose()
                }
            }}
        >
            <CustomDialogHeader
                title="Add Contact"
                onClose={onClose}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen(prevState => !prevState)
                }}
                showManimizeMaximize={true}
            ></CustomDialogHeader>
            <Formik
                initialValues={{ addContact: '', reportsToContact: '' }}
                validationSchema={ReportsToContact}
                onSubmit={onSubmit}
                validateOnMount>
                {({ touched, errors, setFieldValue, values, submitForm }) => (
                    <>
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate>
                                <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                <Box padding={1}>
                                    <Box p={2}>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            freeSolo
                                            options={contactsList.filter(o => Boolean(!o.isExclude))}
                                            autoHighlight
                                            getOptionLabel={(option: any) => option.concatedName || ''}
                                            getOptionSelected={(option: any, val: any) => (option ? option._id === val._id : false)}
                                            onChange={(_, val: any) => {
                                                setFieldValue("addContact", val);
                                            }}
                                            value={values["addContact"]}
                                            renderInput={(params) => <TextField {...params}
                                                label="Add Contact"
                                                variant="outlined"
                                                required={true}
                                                error={
                                                    touched["addContact"] && Boolean(errors["addContact"])
                                                }
                                                helperText={touched["addContact"] && errors["addContact"]}
                                                name="Add Contact"
                                            />}
                                        />
                                    </Box>
                                    <Box p={2}>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            freeSolo
                                            options={reportsToOption}
                                            autoHighlight
                                            getOptionLabel={(option: any) => option?.concatedName || ''}
                                            getOptionSelected={(option: any, val: any) => (option ? option?._id === val?._id : false)}
                                            //onChange={(_, val: any) => { setReportsToContact({ ...val }) }}
                                            onChange={(_, val: any) => {
                                                setFieldValue("reportsToContact", val);
                                            }}
                                            value={values["reportsToContact"]}
                                            renderInput={(params) => <TextField {...params}
                                                label="Reports To"
                                                variant="outlined"
                                                required={true}
                                                error={touched["reportsToContact"] && Boolean(errors["reportsToContact"])}
                                                helperText={touched["reportsToContact"] && errors["reportsToContact"]}
                                                name="Reports To Contact"
                                            />}
                                        />
                                    </Box>
                                </Box>
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button
                                disabled={isSubmitting}
                                color="primary"
                                size="small"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={isSubmitting}
                                type="button"
                                color="primary"
                                variant="contained"
                                size="small"
                                onClick={() => submitForm()}
                            >
                                {isSubmitting ? <CircularProgress size={22} /> : "Save"}
                            </Button>

                        </CustomDialogFooter>
                    </>
                )}
            </Formik>
        </Dialog >
    );
};