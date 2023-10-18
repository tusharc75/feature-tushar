import { useState, useEffect, useContext, Fragment } from 'react';
import { Formik, Form } from 'formik';
import { Box, Button, Grid } from '@material-ui/core';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import FormTypes from '../../../components/Helpers/FormTypes';
import CustomButton from '../../../components/Helpers/CustomButton';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import {
    CHILD_RESOURCE,
    CustomDialogTransition,
    getObjKeys,
    invoice,
    setFieldsInAscendingOrder,
    yupSchema
} from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import Dialog from '@material-ui/core/Dialog';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { FaDiceOne } from 'react-icons/fa';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { isEqual } from 'lodash';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';

const ManageCreditMemoDialog = ({ invoiceData, onClose, onSuccess, open }) => {

    const toastConfig = useContext(CustomToastContext);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [fields, setFields] = useState([]);

    useEffect(() => {
        setFields(setFieldsInAscendingOrder(initialData.fields));
    }, [initialData.fields]);

    useEffect(() => {
        fetchFields();
    }, []);

    const fetchFields = async () => {
        try {
            let data;
            const response: any = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.invoiceCreditMemo}`);
            data = response?.data?.data;
            data = CURReplaceByCurrencySingle(data, invoiceData?.currency ? invoiceData?.currency : "USD");
            setInitialData({
                fields: data,
                values: getObjKeys('', data)
            });

        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const handleSubmit = (values: any) => {
        const newValues = { ...values };
        setSubmitting(true);
        axiosInstance()
            .post(`${invoice.api}/credit-memo/${invoiceData._id}`, newValues)
            .then(({ data: { data, message } }) => {
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

    return (
        <Dialog
            maxWidth="md"
            fullWidth
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                    setShowConfirmDialog(true);
                }
            }}
            open={open}
        >
            {fields && fields?.length ? (
                <Formik initialValues={initialData.values} validationSchema={yupSchema(initialData.fields)} validateOnMount onSubmit={handleSubmit}>
                    {({ values, errors, touched, setFieldValue, handleSubmit }) => (
                        <Fragment>
                            <CustomDialogHeader
                                title={'Create'}
                                onClose={(e, reason) => {
                                    if (isEqual(initialData.values, values)) onClose();
                                    else setShowConfirmDialog(true);
                                }}
                                isMinimized={!fullScreen}
                                onMinimizeMaximize={() => {
                                    setFullScreen((prevState) => !prevState);
                                }}
                                showManimizeMaximize={true}
                            />
                            <CustomDialogContent>
                                <Form autoComplete="off" autoCorrect="off" noValidate>
                                    {fields && fields.map((section, i) => (
                                        <div key={i}>
                                            <div className={'detail-box-content detail-product-box'}>
                                                <div className={'product-form-layout'}>
                                                    <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                                                    <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                                                </div>
                                            </div>
                                            <Box marginY={2}>
                                                <Grid spacing={3} container>
                                                    {section.sectionFields &&
                                                        section.sectionFields.map((field) =>
                                                            field.type === 'converter' || field.type === 'currencyAmount' || field.isConverter ? (
                                                                <FormTypes
                                                                    fields={initialData.fields}
                                                                    fieldData={{ ...field, hideConverter: true }}
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
                                                                    isTooltip={field.isTooltip}
                                                                    tooltipMessage={field.tooltipMessage}
                                                                    size="small"
                                                                />
                                                            ) : (
                                                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                    <Box display="flex">
                                                                        <Box flexGrow={1}>
                                                                            <FormTypes
                                                                                {...field}
                                                                                fields={initialData.fields}
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
                                                                                isTooltip={field.isTooltip}
                                                                                tooltipMessage={field.tooltipMessage}
                                                                                size="small"
                                                                            />
                                                                        </Box>
                                                                    </Box>
                                                                </Grid>
                                                            )
                                                        )}
                                                </Grid>
                                            </Box>
                                        </div>
                                    ))}
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
                                        if (isEqual(initialData.values, values)) onClose();
                                        else setShowConfirmDialog(true);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <CustomButton
                                    loading={submitting}
                                    variant="contained"
                                    color="primary"
                                    disabled={submitting}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleScroll(errors);
                                        handleSubmit();
                                    }}
                                >
                                    Save
                                </CustomButton>
                            </CustomDialogFooter>
                            {showConfirmDialog && (
                                <ConfirmCancelDialog
                                    close={() => setShowConfirmDialog(false)}
                                    open={showConfirmDialog}
                                    onSave={() => {
                                        setShowConfirmDialog(false);
                                        handleScroll(errors);
                                        handleSubmit();
                                    }}
                                    onClose={() => {
                                        setShowConfirmDialog(false);
                                        onClose();
                                    }}
                                />
                            )}
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

export default ManageCreditMemoDialog;
