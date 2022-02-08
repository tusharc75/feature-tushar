import React, { useState, useEffect, useContext } from 'react';
import { Dialog, Box, Button, Grid, CircularProgress, Divider } from '@material-ui/core';

import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { getObjKeys, pricingCondition } from '../../../constants/helpers';
import FormTypes from '../../../components/Helpers/FormTypes';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CurrencyInput from '../../../components/CurrencyInput';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';

const arr = [...Array(9).keys()];

const AddRentDialog = (props) => {
    const { id, fields, close, fetchData, conditionData, pricingConditionId } = props;

    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        values: {},
        fields: [],
    });
    const [submitting, setSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext)

    useEffect(() => {

        if (id) {
            axiosInstance().get(`${pricingCondition.api}/${pricingConditionId}/rate/${conditionData.materialId}/${id}`).then(({ data: { data } }) => {
                setFormData({
                    values: {
                        ...data.productConfiguration
                    },
                    fields
                });

            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });
        } else {
            const values = getObjKeys('', fields);

            setFormData({
                values,
                fields
            });

            setLoading(false);
        }

    }, []);

    const onChange = (name, value) => {
        let newValues = {
            ...formData.values,
            [name]: value
        };
        setFormData({ ...formData, values: newValues });
    };

    const addUpdate = () => {

        setSubmitting(true);

        if (id) {
            axiosInstance()
                .put(`${pricingCondition.api}/${pricingConditionId}/rate/${conditionData.materialId}/${id}`, {
                    product: conditionData.productDetail._id,
                    productConfiguration: { ...formData.values }
                })
                .then(() => {
                    setSubmitting(false);
                    fetchData()
                    close()
                })
                .catch(() => {
                    setSubmitting(false);
                });
        } else {
            axiosInstance()
                .post(`${pricingCondition.api}/${pricingConditionId}/rate/${conditionData.materialId}`, {
                    product: conditionData.productDetail._id,
                    productConfiguration: { ...formData.values }
                })
                .then(() => {
                    setSubmitting(false);
                    fetchData()
                    close()
                })
                .catch(() => {
                    setSubmitting(false);
                });
        }

    };

    return (
        <Dialog open onClose={close} maxWidth="md" fullWidth>
            <CustomDialogHeader title={id ? "Edit" : "Add"} onClose={() => {
                if (submitting) return
                close()
            }} />
            <CustomDialogContent>

                {
                    loading ? <CommonSkeleton lenArray={arr} /> :
                        <Box py={2}>
                            <Grid container spacing={2}>
                                {fields.map((field) => (
                                    <Grid item xs={12} sm={6} key={field.fieldName}>
                                        <FormTypes
                                            isNew={true}
                                            fieldData={field}
                                            values={formData.values}
                                            errors={{}}
                                            touched={{}}
                                            label={field.fieldLabel}
                                            name={field.fieldName}
                                            type={field.type}
                                            options={field.option}
                                            setFieldValue={onChange}
                                            required={field.required}
                                            fullWidth
                                            isTooltip={field?.isTooltip || false}
                                            tooltipMessage={field?.tooltipMessage}
                                            size="small"
                                        />
                                    </Grid>
                                ))}
                            </Grid>

                            <Divider className="mt-3 mb-2" />

                            <Grid container spacing={2}>

                                <Grid item xs={12} sm={6}>
                                    <CurrencyInput
                                        inputTextLabel="Rate"
                                        value={formData.values["rate"] ? Number(formData.values["rate"]) : 0}
                                        currencySymbol={conditionData?.productDetail?.currency ?? ""}
                                        isRequired={true}
                                        allowDecimal={true}
                                        onChange={(value) => {
                                            onChange("rate", value)
                                        }}
                                        variant="outlined"
                                        margin="dense"
                                    />
                                </Grid>

                            </Grid>
                        </Box>
                }

            </CustomDialogContent>
            <CustomDialogFooter>
                <Button disabled={submitting} variant="outlined" color="primary" onClick={close}>
                    Close
                </Button>
                <Button
                    disabled={submitting}
                    variant="contained"
                    color="primary"
                    onClick={addUpdate}
                    endIcon={submitting && <CircularProgress color="inherit" size={18} />}
                >
                    Save
                </Button>
            </CustomDialogFooter>
        </Dialog>
    );
};

export default AddRentDialog;
