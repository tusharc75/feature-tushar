import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, Grid } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { Form, Formik } from 'formik';
import { CustomDialogTransition, getObjKeys, getObjKeysWithValues, isFieldNotTouched, setFieldsInAscendingOrder, yupSchema } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomButton from 'src/components/Helpers/CustomButton';
import FormTypes from 'src/components/Helpers/FormTypes';
import { FaDiceOne } from 'react-icons/fa';
import { Skeleton } from '@material-ui/lab';
import ConfirmCancelDialog from 'src/components/ConfirmCancelDialog';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const arr = [...Array(9).keys()];

const MangageDigitalDialog = ({ open, onClose, digitalId = null, onSuccess, productId }) => {

    const fieldData = [
        {
            "fieldData": {
                "_id": "62d103f69be8b23c5e3fba17",
                "fieldLabel": "Title",
                "type": "singleLine",
                "option": [],
                "required": true,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 1,
                "hiddenField": false,
                "isDefaultValue": false,
                "disableOnEdit": false,
                "unique": true,

                "lookup": false,
                "lookupResource": "",
                "entityWiseLookup": false,
                "isDropdown": false,
                "isWarningTooltip": false,
                "warningTooltipMessage": "",
                "defaultValue": "",
                "fieldName": "title",
                "sectionName": "Digital Information",
                "resource": "Product",
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
        {
            "fieldData": {
                "_id": "62d103f69be8b23c5e3fba18",
                "fieldLabel": "Type",
                "type": "radio",
                "option": [{
                    "optionLabel": "file",
                    "optionValue": "File",
                    "order": 1,
                    "default": true
                },
                {
                    "optionLabel": "key",
                    "optionValue": "Key",
                    "order": 2,
                    "default": false
                }],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 2,
                "fieldName": "type",
                "sectionName": "Digital Information",
                "resource": "Product",
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
        {
            "fieldData": {
                "_id": "63a435bd2da3f42b9da6d26e",
                "fieldLabel": "Internal",
                "type": "checkBox",
                "option": [],
                "required": false,
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 17,
                "fieldName": "internal",
                "sectionName": "Digital Information",
                "resource": "Product",
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
        {
            "fieldData": {
                "_id": "62d103f69be8b23c5e3fba17",
                "fieldLabel": "Key",
                "type": "singleLine",
                "option": [],
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "order": 3,
                "hiddenField": false,
                "isDefaultValue": false,
                "disableOnEdit": false,
                "unique": true,
                "required": true,
                "lookup": false,
                "lookupResource": "",
                "entityWiseLookup": false,
                "isDropdown": false,
                "isWarningTooltip": false,
                "warningTooltipMessage": "",
                "defaultValue": "",
                "fieldName": "key",
                "sectionName": "Digital Information",
                "resource": "Product",
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
        {
            "fieldData": {
                "_id": "62d103f69be8b23c5e3fba17",
                "fieldLabel": "Files",
                "type": "multiFileUpload",
                "option": [],
                "isTooltip": false,
                "tooltipMessage": "",
                "editAble": true,
                "deletAble": true,
                "required": true,
                "order": 4,
                "hiddenField": false,
                "isDefaultValue": false,
                "disableOnEdit": false,
                "unique": true,
                "lookup": false,
                "lookupResource": "",
                "entityWiseLookup": false,
                "isDropdown": false,
                "isWarningTooltip": false,
                "warningTooltipMessage": "",
                "defaultValue": "",
                "fieldName": "file",
                "sectionName": "Digital Information",
                "resource": "Product",
            },
            "isCreate": true,
            "isRead": true,
            "isUpdate": true
        },
    ]
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [digitalData, setDigitalData] = useState({ fields: [], initialValues: {} });
    const [formsData, setFormsData] = useState([]);
    const [formValues, setFormValues] = useState({})
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [loading, setLoading] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        var fieldsDataForCreate = fieldData?.map((d: any) => d.fieldData);
        if (digitalId) {
            axiosInstance().get(`${routes.product.path}/${productId}/digital-product/${digitalId}`).then(({ data: data }) => {
                setDigitalData({
                    fields: fieldsDataForCreate,
                    initialValues: getObjKeysWithValues(data.data, fieldsDataForCreate),
                });
                setFormsData(setFieldsInAscendingOrder(fieldsDataForCreate.filter((d) => data?.data["type"] === "key" ? d.fieldName !== "file" : d.fieldName !== "key")));
            })
                .catch((error) => {
                    setLoading(false);
                });
        }
        else {
            setDigitalData({
                fields: fieldsDataForCreate,
                initialValues: getObjKeysWithValues({ type: "key" }, fieldsDataForCreate),
            });
            setFormsData(setFieldsInAscendingOrder(fieldsDataForCreate.filter((d) => d.fieldName !== "file")));
        }

    }, []);


    const handleSubmit = async (
        errors,
        setTouched,
        values,
        setValues,
        setErrors
    ) => {
        if (Object.keys(errors).length) {
            digitalData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            setErrors({ ...errors });
        } else {
            handleSave(values)
        }
    };

    const handleSave = (data: any) => {
        if (digitalId) {
            data._id = digitalId
            axiosInstance()
                .put(`${routes.product.path}/${productId}/digital-product`, data)
                .then(() => {
                    onSuccess();
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
        else {
            axiosInstance()
                .post(`${routes.product.path}/${productId}/digital-product`, data)
                .then(() => {
                    onSuccess();
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                });
        }
    };

    const handleValuesChange = (data) => {
        if (data["type"]) {
            data["type"] === "key" ?
                setFormsData(setFieldsInAscendingOrder(digitalData.fields.filter((d) => d.fieldName !== "file")))
                : setFormsData(setFieldsInAscendingOrder(digitalData.fields.filter((d) => d.fieldName !== "key")));
        }
        setFormValues((prevState) => ({
            ...prevState,
            ...data
        }))
    }

    return (
        <>
            <Dialog
                maxWidth="md"
                fullWidth
                fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        setShowConfirmDialog(true)
                    }
                }}
                open={open}
            >
                <CustomDialogHeader
                    title={'Digital Product'}
                    onClose={(e, reason) => {
                        if (isFieldNotTouched(digitalData, formValues)) onClose()
                        else setShowConfirmDialog(true)
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
                />
                {!digitalData.fields.length ? (
                    <>
                        <CustomDialogContent>
                            <Skeleton width="100%" height="70px" />
                            <Grid container spacing={2}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                    <Grid key={i} item xs={12} sm={6} md={6}>
                                        <Skeleton width="100%" height="60px" />
                                    </Grid>
                                ))}
                            </Grid>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button variant="outlined" size="small" color="primary" disabled
                            >
                                Cancel
                            </Button>
                            <Button variant="contained" size="small" color="primary" disabled>
                                Submit
                            </Button>
                        </CustomDialogFooter>
                    </>
                ) : (
                    <Formik
                        initialValues={digitalData.initialValues}
                        validationSchema={yupSchema(digitalData.fields)}
                        validateOnMount
                        // validate={validate}
                        onSubmit={() => { }}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            setFieldTouched,
                            setErrors,
                            setValues,
                        }) => (
                            <>
                                <CustomDialogContent>
                                    <Form>
                                        {formsData && formsData.map((form, i) => {
                                            return (
                                                form.name && (
                                                    <div key={i}>
                                                        <div className={"detail-box-content"}>
                                                            <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                            <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                                                        </div>
                                                        <Box marginY={2}>
                                                            <Grid spacing={3} container>
                                                                {form.sectionFields.map((field) => (
                                                                    <Grid key={field.fieldName} item xs={12} sm={6} md={6}   >
                                                                        <FormTypes
                                                                            {...field}
                                                                            fieldData={field}
                                                                            disabled={field.disabled}
                                                                            values={values}
                                                                            errors={errors}
                                                                            touched={touched}
                                                                            label={field.fieldLabel}
                                                                            name={field.fieldName}
                                                                            type={field.type}
                                                                            options={field.option}
                                                                            setFieldValue={(name, value) => {
                                                                                handleValuesChange({ [name]: value })
                                                                                setFieldValue(name, value)
                                                                            }}
                                                                            required={field.required}
                                                                            fullWidth
                                                                            isMultipleUpload={true}
                                                                            isTooltip={field?.isTooltip || false}
                                                                            tooltipMessage={field?.tooltipMessage}
                                                                            size="small"
                                                                            imageOrFileUploadCompletePercentage={
                                                                                ["imageUpload", "fileUpload"].some(
                                                                                    (s) => s === field.type
                                                                                )
                                                                                    ? (completePercentage) => {
                                                                                        setUploadingImageOrFileProgress(
                                                                                            completePercentage
                                                                                        );
                                                                                    }
                                                                                    : null
                                                                            }
                                                                            row={true}
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
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                            if (isFieldNotTouched(digitalData, values)) onClose()
                                            else setShowConfirmDialog(true)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <CustomButton
                                        loading={loading}
                                        variant="contained"
                                        color="primary"
                                        disabled={
                                            uploadingImageOrFileProgress > 0 ||
                                            loading
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (values["type"] === "key") {
                                                delete errors["file"]
                                            } else {
                                                delete errors["key"]
                                            }
                                            handleSubmit(
                                                errors,
                                                setFieldTouched,
                                                values,
                                                setValues,
                                                setErrors
                                            );
                                        }}
                                    >
                                        Save
                                    </CustomButton>
                                </CustomDialogFooter>
                                {
                                    showConfirmDialog ?
                                        <ConfirmCancelDialog
                                            open={showConfirmDialog}
                                            onSave={() => {
                                                setShowConfirmDialog(false)

                                                handleSubmit(
                                                    errors,
                                                    setFieldTouched,
                                                    values,
                                                    setValues,
                                                    setErrors
                                                );
                                            }}
                                            close={() => setShowConfirmDialog(false)}
                                            onClose={() => {
                                                setShowConfirmDialog(false)
                                                onClose()
                                            }}
                                        /> : null
                                }
                            </>
                        )}
                    </Formik>
                )}
            </Dialog>
        </>
    );
};

export default MangageDigitalDialog;
