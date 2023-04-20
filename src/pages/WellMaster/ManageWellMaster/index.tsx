import { useState, useEffect, useContext, useRef } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, CircularProgress, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { isMobile, isTablet } from 'react-device-detect';
import {
    CustomDialogTransition,
    getObjKeys,
    getObjKeysWithValues,
    wellMaster,
    setFieldsInAscendingOrder,
    yupSchema,
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import Skeleton from '@material-ui/lab/Skeleton/Skeleton';
import { useHistory } from 'react-router-dom';
import { FaDiceOne } from "react-icons/fa";
import { useData } from "../../../StateProvider/Provider";
import { isEqual } from 'lodash';

const ManageWellMaster = ({ isClone = false, wellMasterId = null, onClose, onSuccess, refrenceData = null }) => {

    const initialRender = useRef(true)

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);
    const { state: { permissions, user, selectedEntity } }: any = useData();

    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [allFields, setAllFields] = useState([]);
    const [title, setTitle] = useState("");


    const ref = useRef(null);

    useEffect(() => {
        setLoading(true);
        axiosInstance().get('/field?resource=Well Master').then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (wellMasterId) {
                axiosInstance().get(`${wellMaster.api}/` + wellMasterId).then(({ data: { data } }) => {
                    if (isClone) {
                        const { _id, brand, createdBy, wellName, updatedBy, ...rest } = data;
                        setTitle(`Clone - ${wellName}`)
                        setInitialData({
                            fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                            values: { ...getObjKeysWithValues(rest, fieldsDataForCreate) }
                        });
                        setAllFields(fieldsDataForCreate);
                        setLoading(false);
                    } else {
                        setTitle(`Editing - ${data.wellName}`)
                        setInitialData({
                            fields: setFieldsInAscendingOrder(fieldsDataForUpdate),
                            values: getObjKeysWithValues(data, fieldsDataForUpdate)
                        });
                        setAllFields(fieldsDataForUpdate);

                        setLoading(false);
                    }
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            } else {
                setTitle('Create Well Master')
                let initialData = { ...getObjKeys('', fieldsDataForCreate) };

                setAllFields(fieldsDataForCreate);
                setInitialData({
                    fields: setFieldsInAscendingOrder(fieldsDataForCreate),
                    values: initialData
                });
                setLoading(false);
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [wellMasterId]);

    const handleSubmit = (values) => {
        handleUpdateWellMaster(values);
    };

    const handleUpdateWellMaster = (values) => {
        setSubmitting(true);
        if (wellMasterId && isClone === false) {
            values._id = wellMasterId;
            axiosInstance()
                .put(`${wellMaster.api}`, values)
                .then(({ data }) => {
                    setSubmitting(false);
                    onSuccess(data.data);
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                })
                .catch((error) => {
                    setSubmitting(false);
                    toastConfig.setToastConfig(error);
                });
        } else {
            axiosInstance().post(`${wellMaster.api}`, values).then(({ data: { data, message } }) => {
                setSubmitting(false);
                onSuccess(data);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: message
                });
            })
                .catch((error) => {
                    setSubmitting(false);
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const handleScroll = (errors) => {
        const err = Object.keys(errors);
        if (err.length) {
            const input = document.querySelector(`input[name=${err[0]}]`);
            input.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'start'
            });
        }
    };

    return (<Dialog
        maxWidth="md"
        fullWidth
        fullScreen={fullScreen || (isMobile || isTablet)}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                setShowConfirmDialog(true);
            }
        }}
        open={true}
    >
        {loading || !initialData.fields.length ? (
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
                    <Button variant="outlined" size="small" color="primary" disabled>
                        Cancel
                    </Button>
                    <Button variant="contained" size="small" color="primary" disabled>
                        Submit
                    </Button>
                </CustomDialogFooter>
            </>
        ) : (
            <Formik
                innerRef={ref}
                initialValues={initialData.values}
                validationSchema={yupSchema(allFields)}
                validateOnMount
                onSubmit={handleSubmit}>
                {({ values, errors, touched, setFieldValue, setFieldTouched, setErrors, setValues, submitForm }) => (
                    <>
                        <CustomDialogHeader
                            title={title}
                            onClose={(e, reason) => {
                                if (!isEqual(ref.current.values, initialData.values)) {
                                    setShowConfirmDialog(true)
                                }
                                else {
                                    onClose()
                                }
                            }}
                            isMinimized={!fullScreen}
                            onMinimizeMaximize={() => {
                                setFullScreen(prevState => !prevState)
                            }}
                            showManimizeMaximize={true}
                        />
                        <CustomDialogContent>
                            <Form>
                                {initialData.fields.length > 0 &&
                                    initialData.fields.map((form, i) => {
                                        return (
                                            form.name && (
                                                <div key={i}>
                                                    <div className={"detail-box-content"}>
                                                        <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                        <h2 className={`${"form-label-style"} ${"form-label-quotes"}`}>{form.name}</h2>
                                                    </div>
                                                    <Box marginY={2}>
                                                        <Grid spacing={3} container>
                                                            {form.sectionFields.map((field) =>
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                    {<FormTypes
                                                                        wellMasterId={wellMasterId}
                                                                        {...field}
                                                                        disabled={(!wellMasterId && field.disableOnEdit) || (field.fieldName === "wellMasterName")}
                                                                        values={values}
                                                                        errors={errors}
                                                                        fieldData={field}
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
                                                                    />}

                                                                </Grid>
                                                            )}
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
                                disabled={submitting}
                                type="button"
                                variant="outlined"
                                color="primary"
                                size="small"
                                onClick={() => {
                                    if (!isEqual(ref.current.values, initialData.values)) {
                                        setShowConfirmDialog(true)
                                    }
                                    else {
                                        onClose()
                                    }
                                }}
                            >
                                Cancel
                            </Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                startIcon={submitting && <CircularProgress size={20} color='inherit' />}
                                disabled={submitting}
                                onClick={(e) => {
                                    submitForm();
                                }}
                            >
                                Save
                            </CustomButton>
                        </CustomDialogFooter>
                        {showConfirmDialog ? (
                            <ConfirmCancelDialog
                                close={() => setShowConfirmDialog(false)}
                                open={showConfirmDialog}
                                onSave={() => {
                                    setShowConfirmDialog(false);
                                    handleScroll(errors);
                                    submitForm();
                                }}
                                onClose={() => {
                                    setShowConfirmDialog(false);
                                    onClose();
                                }}
                            />
                        ) : null}

                    </>
                )}
            </Formik>
        )}
    </Dialog>

    );
};

export default ManageWellMaster;
