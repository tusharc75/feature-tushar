import React, { useContext, useState, useEffect, Fragment } from 'react'
import { Box, Button, CircularProgress, Dialog, Grid } from '@material-ui/core'
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog'
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent'
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader'
import { CustomDialogTransition, getObjKeysWithValues, repairJob, yupSchema, REPAIR_JOB_STATUS } from '../../constants/helpers'
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext'
import { Formik, Form } from 'formik'
import { FaDiceOne } from 'react-icons/fa'
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import FormTypes from '../../components/Helpers/FormTypes'
import { uniq, map, orderBy } from 'lodash'
import moment from 'moment'

export default function ManageAssetDialog({ open, fields, asset, selectedRecords, onSuccess, onClose, repairJobData }) {

    const { _id } = repairJobData;
    const [initialData, setInitialData] = useState({ fields: [], values: {} });
    const [isUpdating, setIsUpdating] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [customFields, setCustomFields] = useState([]);

    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {

        setInitialData({
            fields: fields,
            values: getObjKeysWithValues(asset ? { ...asset, expectedCompletionDate: (asset["expectedCompletionDate"] ? asset["expectedCompletionDate"] : repairJobData["expectedCompletionDate"]) } : { expectedCompletionDate: repairJobData["expectedCompletionDate"] }, fields),
        });

        const sections = uniq(map(fields, 'sectionName'));
        const customData = sections.map((name) => {
            let sectionFields = fields.filter((field) => field.sectionName === name);
            sectionFields = orderBy(sectionFields, 'order', 'asc');
            return { name, sectionFields };
        });

        setCustomFields(customData)

    }, [])

    const handleSubmit = (values) => {
        const prepareDataToUpdate = [];

        if (selectedRecords.length > 0) {
            selectedRecords.forEach(d => {
                prepareDataToUpdate.push({
                    ...values,
                    id: d.id,
                })
            })
        } else {
            prepareDataToUpdate.push({
                ...values,
                id: asset.id,
            })
        }

        axiosInstance().put(`${repairJob.repairJobApi}/${_id}/update-assets`, prepareDataToUpdate).then(() => {
            setIsUpdating(false);
            onSuccess();
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        })

    }

    return (
        <>
            <Dialog
                fullWidth
                maxWidth="md"
                // fullScreen={fullScreen || (isMobile || isTablet)}
                TransitionComponent={CustomDialogTransition}
                aria-labelledby="customized-dialog-title"
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        setShowConfirmDialog(true)
                    }
                }}
                open={open}
            >

                {initialData && initialData.fields.length ?
                    <Formik
                        enableReinitialize={true}
                        initialValues={initialData.values}
                        validationSchema={yupSchema(initialData.fields)}
                        validateOnMount
                        onSubmit={handleSubmit}>
                        {({ values,
                            errors,
                            touched,
                            setFieldValue,
                            submitForm,
                        }) => (
                            <Fragment>
                                <CustomDialogHeader
                                    title={asset ? `Edit - ${asset.index} - ${asset.assetNumber}` : ("Bulk Edit " + "(" + selectedRecords.length + ")")}
                                    onClose={() => {
                                        onClose()
                                    }}
                                    // isMinimized={!fullScreen}
                                    // onMinimizeMaximize={() => {
                                    //     setFullScreen(prevState => !prevState)
                                    // }}
                                    showManimizeMaximize={false}
                                ></CustomDialogHeader>

                                <CustomDialogContent>
                                    <Form autoComplete="off" autoCorrect="off" noValidate >
                                        {customFields && customFields.map((section, i) => (
                                            <div key={i}>
                                                <div className={"detail-box-content detail-product-box"}>
                                                    <div className={"product-form-layout"}>
                                                        <FaDiceOne size={16} color={"var(--white)"} style={{ marginRight: "5px" }} />
                                                        <h2 className={`${"form-label-style"} ${"form-label-product"}`} >
                                                            {section.name}
                                                        </h2>
                                                    </div>
                                                </div>
                                                <Box marginY={2}>
                                                    <Grid spacing={3} container>
                                                        {section.sectionFields && section.sectionFields.map((field) => (
                                                            <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                                                <Box display="flex">
                                                                    <Box flexGrow={1}>
                                                                        {field.fieldName === "expectedCompletionDate"
                                                                            ? <FormTypes
                                                                                {...field}
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
                                                                                minDate={repairJobData["startDate"] ? moment(repairJobData["startDate"]) : undefined}
                                                                            /> : <FormTypes
                                                                                {...field}
                                                                                disabled={repairJobData["status"] === REPAIR_JOB_STATUS.completed ? true : field.disableOnEdit}
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
                                                                                    setFieldValue(name, value)
                                                                                }}
                                                                                required={field.required}
                                                                                fullWidth
                                                                                isTooltip={field.isTooltip}
                                                                                tooltipMessage={field.tooltipMessage}
                                                                                size="small"
                                                                            />}

                                                                    </Box>
                                                                </Box>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                </Box>
                                            </div>
                                        ))}
                                    </Form>
                                </CustomDialogContent>
                                <CustomDialogFooter>
                                    <Button
                                        size="small"
                                        variant="outlined" color="primary" onClick={onClose}>
                                        Cancel
                                    </Button>

                                    {
                                        repairJobData["status"] === REPAIR_JOB_STATUS.completed ? "" : <Button
                                            size="small"
                                            onClick={() => {
                                                setIsUpdating(true);
                                                submitForm();
                                            }}
                                            disabled={isUpdating || Object.keys(errors).length > 0}
                                            variant="contained"
                                            color="primary"
                                        >
                                            {
                                                isUpdating ? <CircularProgress
                                                    style={{ marginRight: "8px" }}
                                                    size={20} color="inherit" /> : null
                                            }
                                            Update
                                        </Button>
                                    }

                                </CustomDialogFooter>
                            </Fragment>
                        )}
                    </Formik>
                    :
                    <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(fields.length).keys()]} />
                    </Box>}

            </Dialog>

            {
                showConfirmDialog ?
                    <ConfirmCancelDialog
                        close={() => setShowConfirmDialog(false)}
                        open={showConfirmDialog}
                        onSave={() => {
                            setShowConfirmDialog(false);
                            // e.preventDefault();

                            // if (err.length) {
                            //     const input = document.querySelector(
                            //         `input[name=${err[0]}]`,
                            //     );

                            //     input.scrollIntoView({
                            //         behavior: 'smooth',
                            //         block: 'center',
                            //         inline: 'start',
                            //     });
                            // }
                        }}
                        onClose={() => {
                            setShowConfirmDialog(false)
                            onClose()
                        }}
                    /> : null
            }

        </>
    )
}
