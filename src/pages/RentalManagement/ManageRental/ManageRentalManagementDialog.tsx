import { useState, useEffect, useContext } from "react";
import { Formik, Form } from "formik";
import { Box, Button, Grid } from "@material-ui/core";
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import FormTypes from "../../../components/Helpers/FormTypes";
import CustomButton from "../../../components/Helpers/CustomButton";
import CustomDialogContent from "../../../components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "../../../components/CustomDialog/CustomDialogFooter";
import { useData } from "../../../StateProvider/Provider";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, getCollaboratorDropdownDataSource, getObjKeys, getObjKeysWithValues, getOwnerDropdownDataSource, isFieldNotTouched, rentalManagement, setFieldsInAscendingOrder, yupSchema } from "../../../constants/helpers";
import axiosInstance from '../../../axios/axiosInstance'
import Dialog from "@material-ui/core/Dialog";
import ConfirmCancelDialog from "../../../components/ConfirmCancelDialog";
import Skeleton from "@material-ui/lab/Skeleton/Skeleton";
import { useHistory } from 'react-router-dom'
import routes from "../../../components/Helpers/Routes";
import { CustomOfflineContext } from "../../../StateProvider/OfflineContext/OfflineContext";

const ManageRentalManagementDialog = ({ isClone, rentalManagementId, rentalManagementData = null, onClose, onSuccess, open }) => {

    const history = useHistory()
    const toastConfig = useContext(CustomToastContext);
    const { isOffline, offlineFieldsData, offlineGridData } = useContext(CustomOfflineContext);

    const [loading, setLoading] = useState(false);
    const [rentalData, setRentalData] = useState({ fields: [], initialValues: {} });
    const [uploadingImageOrFileProgress, setUploadingImageOrFileProgress] = useState(0);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [formsData, setFormsData] = useState([]);
    const [ownerCollaboratorData, setOwnerCollaboratorData] = useState([]);
    const [ownerData, setOwnerData] = useState([]);
    const [collaboratorData, setCollaboratorData] = useState([]);
    const {
        state: { user },
    }: any = useData();
    const [formValues, setFormValues] = useState({})
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    
    useEffect(() => {

        const ownerCollabOptions = rentalData.fields.filter(
            (d) => ["owner", "collaborator"].indexOf(d.fieldName) !== -1
        );
        if (ownerCollabOptions.length > 0) {
            setOwnerCollaboratorData(ownerCollabOptions[0].option);
            setOwnerData(ownerCollabOptions[0].option);
            setCollaboratorData(ownerCollabOptions[0].option);
        }

        setFormsData(setFieldsInAscendingOrder(rentalData.fields));
    }, [rentalData.fields]);

    const onOwnerDropdownOpen = (selectedCollaborator) => {
        setOwnerData(
            getOwnerDropdownDataSource(selectedCollaborator, ownerCollaboratorData)
        );
    };

    const onCollabOwnerMultiselectOpen = (selectedOwnerId) => {
        setCollaboratorData(
            getCollaboratorDropdownDataSource(selectedOwnerId, ownerCollaboratorData)
        );
    };

    useEffect(() => {
        setLoading(true);
        fetchFields();

    }, [rentalManagementId]);

    const fetchFields = async () => {
        try {
            let fieldData;

            if (navigator.onLine) {
                const response: any = await axiosInstance().get("/field?resource=Rental Management");
                fieldData = response?.data?.data;
            }
            else {
                fieldData = offlineFieldsData?.rentalManagement || [];
            }

            const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (rentalManagementId) {

                try {
                    let data;

                    if (!isOffline) {
                        const response: any = await axiosInstance().get(`${rentalManagement.rentalManagementApi}/` + rentalManagementId);
                        data = response?.data?.data;
                    } else {
                        data = offlineGridData?.rentalManagement?.find(d => d._id === rentalManagementId)
                    }

                    if (isClone) {
                        const { _id, brand, createdBy, entity, history, products, rentalJobName, updatedBy, ...rest } = data

                        setRentalData({
                            fields: fieldsDataForCreate,
                            initialValues: getObjKeysWithValues(rest, fieldsDataForCreate),
                        });
                        setFormValues(getObjKeysWithValues(rest, fieldsDataForCreate))
                        setLoading(false)
                    } else {
                        setRentalData({
                            fields: fieldsDataForUpdate,
                            initialValues: getObjKeysWithValues(data, fieldsDataForUpdate),
                        });
                        setFormValues(getObjKeysWithValues(data, fieldsDataForUpdate))
                        setLoading(false)
                    }

                } catch (error) {
                    toastConfig.setToastConfig(error);
                }
            }
            else {
                let initialData = getObjKeys("", fieldsDataForCreate);
                initialData["currency"] = user.user?.brandCurrency || "";
                setRentalData({
                    fields: fieldsDataForCreate,
                    initialValues: initialData,
                });
                setFormValues(initialData)
                setLoading(false)
            }

        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    }

    const handleSubmit = async (
        errors,
        setTouched,
        values,
        setValues,
        setErrors
    ) => {
        if (Object.keys(errors).length) {
            rentalData.fields.forEach((input) => {
                if (input.required || values[input.fieldName]) {
                    setTouched(input.fieldName, true);
                }
            });
            setErrors({ ...errors });
        } else {
            handleUpdateRentalManagement(values)
        }
    };

    const handleUpdateRentalManagement = (values) => {
        setLoading(true);
        if (rentalManagementId && isClone === false) {
            values._id = rentalManagementId

            if (!isOffline) {
                axiosInstance().put(`${rentalManagement.rentalManagementApi}`, values).then(({ data }) => {
                    setLoading(false);
                    onSuccess()
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: data.message,
                    });
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            } else {
                let storedData = {};

                if (localStorage.getItem("offlineDataToSave")) {
                    storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
                }

                const dataToSave = {
                    api: rentalManagement.rentalManagementApi,
                    method: "put",
                    values: values
                };

                if (!storedData["rentalManagement"]) {
                    storedData["rentalManagement"] = [];
                }
                storedData["rentalManagement"].push(dataToSave)

                localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));

                setLoading(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: "info",
                    message: "Updates are in offline state, it will be affected once you will be in network",
                });
                onSuccess();
            }
        }
        else {
            if (!isOffline) {
                axiosInstance().post(`${rentalManagement.rentalManagementApi}`, values).then(({ data: { data, message } }) => {
                    history.push(`${routes.rentalManagementDetail.path}/${data}`)
                    setLoading(false);
                    onSuccess(data)
                    toastConfig.setToastConfig({
                        open: true,
                        type: "success",
                        message: message,
                    });
                }).catch((error) => {
                    setLoading(false);
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                let storedData = {};

                if (localStorage.getItem("offlineDataToSave")) {
                    storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
                }

                const dataToSave = {
                    api: rentalManagement.rentalManagementApi,
                    method: "post",
                    values: values
                };

                if (!storedData["rentalManagement"]) {
                    storedData["rentalManagement"] = [];
                }
                storedData["rentalManagement"].push(dataToSave)

                localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));
                onSuccess();
            }
        }
    };

    const handleScroll = (errors) => {
        const err = Object.keys(errors);
        if (err.length) {
            const input = document.querySelector(
                `input[name=${err[0]}]`,
            );

            input.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'start',
            });
        }
    }

    const handleValuesChange = (data) => {
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
                    title={
                        !rentalManagementId
                            ? `Create ${routes.rentalManagement.title}`
                            : `${isClone ? "Clone" : `Update ${rentalManagementData?.rentalJobName}`}`
                    }
                    onClose={(e, reason) => {
                        if (isFieldNotTouched(rentalData, formValues)) onClose()
                        else setShowConfirmDialog(true)
                    }}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen(prevState => !prevState)
                    }}
                    showManimizeMaximize={true}
                />
                {!rentalData.fields.length ? (
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
                        initialValues={rentalData.initialValues}
                        validationSchema={yupSchema(rentalData.fields)}
                        validateOnMount
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
                                        <h2 className="form-label-style" style={{ borderBottom: "none" }}>* Required Fields</h2>
                                        {formsData &&
                                            formsData.map((form, i) => {
                                                return (
                                                    form.name && (
                                                        <div key={i}>
                                                            <h2 className="form-label-style">{form.name}</h2>
                                                            <Box marginY={2}>
                                                                <Grid spacing={3} container>
                                                                    {form.sectionFields.map((field) => (
                                                                        <Grid
                                                                            key={field.fieldName}
                                                                            item
                                                                            xs={12}
                                                                            sm={6}
                                                                            md={6}
                                                                        >
                                                                            {field.fieldName === "owner" ? (
                                                                                <FormTypes
                                                                                    rentalManagementId={rentalManagementId}
                                                                                    {...field}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={ownerData}
                                                                                    onChange={(e, val) => {
                                                                                        setFieldValue(
                                                                                            field.fieldName,
                                                                                            val && val.optionValue
                                                                                                ? val.optionValue
                                                                                                : ""
                                                                                        );
                                                                                        handleValuesChange({ [field.fieldName]: val && val.optionValue ? val.optionValue : "" })

                                                                                        if (
                                                                                            val &&
                                                                                            val.optionValue !== user?.user?._id
                                                                                        ) {
                                                                                            const checkOwnerAddedInCollaborator =
                                                                                                values["collaborator"].find(
                                                                                                    (d) =>
                                                                                                        d?.optionValue ===
                                                                                                        user?.user?._id
                                                                                                );
                                                                                            if (
                                                                                                !checkOwnerAddedInCollaborator
                                                                                            ) {
                                                                                                setFieldValue("collaborator", [
                                                                                                    ...values["collaborator"],
                                                                                                    collaboratorData.find(
                                                                                                        (d) =>
                                                                                                            d?.optionValue ===
                                                                                                            user?.user?._id
                                                                                                    ).optionValue,
                                                                                                ]);
                                                                                                handleValuesChange({
                                                                                                    collaborator: collaboratorData.find(
                                                                                                        (d) =>
                                                                                                            d?.optionValue ===
                                                                                                            user?.user?._id
                                                                                                    ).optionValue
                                                                                                })
                                                                                            }
                                                                                        }
                                                                                    }}
                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                    disabled={(!rentalManagementId && field.disableOnEdit)}
                                                                                    onOpen={() => {
                                                                                        onOwnerDropdownOpen(
                                                                                            values["collaborator"]
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : field.fieldName === "collaborator" ? (
                                                                                <FormTypes
                                                                                    rentalManagementId={rentalManagementId}
                                                                                    {...field}
                                                                                    disabled={!rentalManagementId && field.disableOnEdit}
                                                                                    values={values}
                                                                                    errors={errors}
                                                                                    touched={touched}
                                                                                    label={field.fieldLabel}
                                                                                    name={field.fieldName}
                                                                                    type={field.type}
                                                                                    options={collaboratorData}
                                                                                    setFieldValue={(name, value) => {
                                                                                        handleValuesChange({ [name]: value })
                                                                                        setFieldValue(name, value)
                                                                                    }}

                                                                                    required={field.required}
                                                                                    fullWidth
                                                                                    isTooltip={field?.isTooltip || false}
                                                                                    tooltipMessage={field?.tooltipMessage}
                                                                                    size="small"
                                                                                    onOpen={() => {
                                                                                        onCollabOwnerMultiselectOpen(
                                                                                            values["owner"]
                                                                                        );
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <FormTypes
                                                                                    rentalManagementId={rentalManagementId}
                                                                                    {...field}
                                                                                    disabled={(!rentalManagementId && field.disableOnEdit)}
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
                                                                                />
                                                                            )}
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
                                            if (isFieldNotTouched(rentalData, values)) onClose()
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
                                            // loading || Object.keys(errors).length > 0 ? true : false
                                            uploadingImageOrFileProgress > 0 ||
                                            isFieldNotTouched(rentalData, values) ||
                                            loading
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleScroll(errors)
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
                                                handleScroll(errors)

                                                handleSubmit(
                                                    errors,
                                                    setFieldTouched,
                                                    values,
                                                    setValues,
                                                    setErrors
                                                );
                                            }}
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

}

export default ManageRentalManagementDialog;

