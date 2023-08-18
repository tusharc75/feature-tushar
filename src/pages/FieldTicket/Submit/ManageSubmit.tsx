import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import ConfirmationCancelDialog from 'src/components/ConfirmCancelDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, fieldTicket, fieldTicketSteps, getObjKeys, setFieldsInAscendingOrder } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from 'src/components/Helpers/FormTypes';

const ManageSubmit = ({ onClose, onSuccess, fieldTicketData }) => {

    const toastConfig = useContext(CustomToastContext);
    const [initialData, setInitialData] = useState<any>({ fields: [], values: {} });
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [formsData, setFormsData] = useState([]);
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            let data = [
                {
                    "fieldData": {
                        "fieldLabel": "Signature",
                        "type": "signature",
                        "option": [],
                        "required": false,
                        "isTooltip": false,
                        "tooltipMessage": "",
                        "editAble": true,
                        "deletAble": true,
                        "order": 1,
                        "sectionName": "Submit Information",
                        "fieldName": "signature",
                        "roleType": 0,
                        "resource": "Field Ticket"
                    },
                    "isCreate": true,
                    "isRead": true,
                    "isUpdate": true
                },
                {
                    "fieldData": {
                        "fieldLabel": "File",
                        "type": "fileUpload",
                        "option": [],
                        "required": false,
                        "isTooltip": false,
                        "tooltipMessage": "",
                        "editAble": true,
                        "deletAble": true,
                        "order": 18,
                        "sectionName": "Submit Information",
                        "fieldName": "file",
                        "roleType": 0,
                        "resource": "Field Ticket"
                    },
                    "isCreate": true,
                    "isRead": true,
                    "isUpdate": true
                },
                {
                    "fieldData": {
                        "fieldLabel": "Comment",
                        "type": "multiLine",
                        "option": [],
                        "required": false,
                        "isTooltip": false,
                        "tooltipMessage": "",
                        "editAble": true,
                        "deletAble": true,
                        "order": 19,
                        "sectionName": "Submit Information",
                        "fieldName": "comment",
                        "roleType": 0,
                        "resource": "Field Ticket"
                    },
                    "isCreate": true,
                    "isRead": true,
                    "isUpdate": true
                }
            ]
            let fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const tempInitialData = getObjKeys('', fieldsDataForCreate);
            setInitialData({
                fields: fieldsDataForCreate,
                values: tempInitialData
            });
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    useEffect(() => {
        setFormsData(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        const obj: any = {
            comment: values?.comment
        }
        if (values.file && values.file !== "") {
            obj.file = values.file
        }
        if (values.signature && values.signature !== "") {
            obj.signature = values.signature;
        }

        await axiosInstance().put(`${fieldTicket.api}/${fieldTicketData._id}/submit`, obj).then(({ data }) => {
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: data?.message
            });
            setSubmitting(false);
            onSuccess();
        }).catch((err) => {
            setSubmitting(false);
            toastConfig.setToastConfig(err)
        })

        setSubmitting(false);
    };

    return (
        <Dialog
            maxWidth="md"
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
            fullWidth
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    setShowConfirmDialog(true);
                }
            }}
        >
            {initialData.fields.length ? (
                <Formik initialValues={initialData.values} onSubmit={handleSubmit}>
                    {({ values, errors, setFieldValue, touched, submitForm }) => (
                        <Fragment>
                            <CustomDialogHeader
                                onClose={() => {
                                    if (isEqual(initialData.values, values)) onClose();
                                    else setShowConfirmDialog(true);
                                }}
                                title={`Submit Field Ticket`}
                                isMinimized={!fullScreen}
                                onMinimizeMaximize={() => {
                                    setFullScreen((prevState) => !prevState);
                                }}
                                showManimizeMaximize={true}
                            />
                            <CustomDialogContent>
                                <Form autoComplete="off" autoCorrect="off" noValidate>
                                    {formsData &&
                                        formsData.map((form, i) => {
                                            return (
                                                form.name && (
                                                    <div key={i}>
                                                        <div className={'detail-box-content'}>
                                                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                                            <h2 className={`${'form-label-style'} ${'form-label-quotes'}`}>{form.name}</h2>
                                                        </div>
                                                        <Box padding={2}>
                                                            <Grid spacing={5} container>
                                                                {form.sectionFields.map((field) => (
                                                                    <Grid key={field.fieldName} item xs={12} sm={12} md={12}>
                                                                        <FormTypes
                                                                            {...field}
                                                                            fieldData={field}
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
                                                                            type={field.type}
                                                                            options={field.option}
                                                                            setFieldValue={(name, value) => {
                                                                                setFieldValue(name, value);
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            imageOrFileUploadCompletePercentage={
                                                                                ['imageUpload', 'fileUpload'].some((s) => s === field.type)
                                                                                    ? (completePercentage) => {
                                                                                        setUploadingImageOrFileProgress(completePercentage);
                                                                                    }
                                                                                    : null
                                                                            }
                                                                            fields={initialData?.fields}
                                                                        />
                                                                    </Grid>
                                                                ))}
                                                            </Grid>
                                                        </Box>
                                                    </div>
                                                )
                                            );
                                        })}
                                </Form>
                            </CustomDialogContent>
                            <CustomDialogFooter>
                                <Button
                                    size="small"
                                    color="primary"
                                    disabled={submitting}
                                    onClick={() => {
                                        if (isEqual(initialData.values, values)) onClose();
                                        else setShowConfirmDialog(true);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    disabled={submitting || !(values.signature !== "" || values.file !== "")}
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    type="submit"
                                    onClick={submitForm}
                                    endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                                >
                                    {' '}
                                    Save
                                </Button>
                            </CustomDialogFooter>
                            {showConfirmDialog ? (
                                <ConfirmationCancelDialog
                                    close={() => setShowConfirmDialog(false)}
                                    open={showConfirmDialog}
                                    onSave={() => {
                                        setShowConfirmDialog(false);
                                        submitForm();
                                    }}
                                    onClose={() => {
                                        setShowConfirmDialog(false);
                                        onClose();
                                    }}
                                />
                            ) : null}
                        </Fragment>
                    )}
                </Formik>
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
        </Dialog>
    );
};

export default ManageSubmit;
