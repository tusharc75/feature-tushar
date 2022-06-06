import { useState, useEffect, useContext } from 'react';
import { Box, Button, Grid, Tab, Tabs, TextField, Typography } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, transferInventory } from '../../../constants/helpers';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import axiosInstance from 'src/axios/axiosInstance';
import { productInventory } from '../../../constants/helpers';
import { Formik, Form, Field } from 'formik';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

const AssignSerialNumber = ({ handleClose, qty, handleSuccess, serialNumber, product, warehouse, transferInventoryData }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [serialNumbers, setSerialNumbers] = useState([]);
    const [loading, setLoading] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        axiosInstance()
            .get(`${productInventory.api}/serial-number/${product}?warehouse=${warehouse}`)
            .then(({ data: { data } }) => {
                setSerialNumbers([...serialNumber, ...data]);
            })
            .catch((err) => {
            });
    };

    const handleSubmit = (values) => {
        setLoading(true);
        const serialNumberIds = serialNumbers.filter((item: any) => values['serialNumbers'].indexOf(item?.serialNumber) > -1);
        const data = []
        serialNumberIds?.forEach((obj) => {
            data.push(obj._id)
        })
        axiosInstance().post(`${transferInventory.api}/${transferInventoryData?._id}/serial-number`, { serialNumber: data, product })
            .then(({ data: { data } }) => {
                setLoading(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: `Assigned Successfully`
                });
                handleSuccess();
            })
            .catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
    }

    function validate(values) {
        const errors = {};
        if (values['serialNumbers']?.length > qty) {
            errors['serialNumbers'] = `Please select serial numbers same as quantity`;
        }
        return errors;
    }

    return (<Dialog
        fullWidth
        maxWidth="sm"
        open={true}
        fullScreen={fullScreen || isMobile || isTablet}
        onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
                handleClose();
            }
        }}
        aria-labelledby="assign-roles-dialog"
    >
        <CustomDialogHeader
            title={'Assign Serial Number'}
            onClose={handleClose}
            showRequiredLabel={false}
        ></CustomDialogHeader>

        <Formik initialValues={{ serialNumbers: serialNumber?.map((item: any) => item?.serialNumber) }} onSubmit={handleSubmit} validateOnMount validate={validate}>
            {({ submitForm, touched, errors, setFieldValue, values }) => (
                <Form autoComplete="off" autoCorrect="off" noValidate>
                    <CustomDialogContent>
                        <Box style={{ minHeight: "100px" }}>
                            <Autocomplete
                                size="small"
                                options={serialNumbers.map((item: any) => item?.serialNumber)}
                                freeSolo={false}
                                multiple={true}
                                disableCloseOnSelect
                                value={values['serialNumbers']}
                                onChange={(_, val) => {
                                    setFieldValue('serialNumbers', val);
                                }}
                                getOptionSelected={(item, current) => item === current}
                                getOptionLabel={(option) => option}
                                renderInput={(props) => (
                                    <TextField
                                        {...props}
                                        variant="outlined"
                                        name="serialNumbers"
                                        label={'Select Serial Numbers'}
                                        error={touched['serialNumbers'] && Boolean(errors['serialNumbers'])}
                                        helperText={touched['serialNumbers'] && errors['serialNumbers']}
                                    />
                                )}
                            />
                        </Box>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <CustomButton
                            loading={loading}
                            disabled={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={submitForm}>
                            Add
                        </CustomButton>
                    </CustomDialogFooter>
                </Form>
            )}
        </Formik>
    </Dialog>
    );
};

export default AssignSerialNumber;
