import { useState, useEffect, Fragment, useContext } from "react";
import Button from '@material-ui/core/Button';
import { Formik, Form } from "formik";
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomButton from '../../components/Helpers/CustomButton'
import routes from "../../components/Helpers/Routes";
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition, productInventory } from "./../../constants/helpers";
import InputField from "../../components/Helpers/InputField";
import { getObjKeysWithValues, getObjKeys, yupSchema } from "../../constants/helpers";
import CommonSkeleton from '../../components/Helpers/CommonSkeleton'
import { Box } from '@material-ui/core';

const CreateProductInventory = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { productInventoryId, onClose, onSuccess } = props;
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState({ fields: [], values: {} });

    useEffect(() => {
        axiosInstance().get("/field?resource=Product Inventory").then(({ data: { data } }) => {
            const fieldsDataForCreate = data.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
            const fieldsDataForUpdate = data.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

            if (productInventoryId) {
                axiosInstance().get(`${productInventory.api}/` + productInventoryId).then(({ data: { data } }) => {
                    setInitialData({
                        fields: fieldsDataForUpdate,
                        values: getObjKeysWithValues(data, fieldsDataForUpdate),
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            }
            else {
                setInitialData({
                    fields: fieldsDataForCreate,
                    values: getObjKeys("", fieldsDataForCreate),
                });
            }
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [productInventoryId]);


    const handleSubmit = (values) => {
        if (productInventoryId) {
            values._id = productInventoryId
            axiosInstance().put(`${productInventory.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess()
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().post(`${productInventory.api}`, values).then(({ data: { data } }) => {
                setLoading(false);
                onSuccess(data)
            }).catch((error) => {
                setLoading(false);
                toastConfig.setToastConfig(error);
            });
        }
    };

    return (<Dialog
        maxWidth="md"
        fullScreen={isMobile || isTablet}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
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
                        <CustomDialogHeader title={productInventoryId ? "Update " + routes.productCategory.title : "Create " + routes.productCategory.title} onClose={onClose}></CustomDialogHeader>
                        <CustomDialogContent>
                            <Form autoComplete="off" autoCorrect="off" noValidate >
                                <InputField
                                    errors={errors}
                                    values={values}
                                    setFieldValue={setFieldValue}
                                    touched={touched}
                                    fieldsData={initialData.fields}
                                    size="small"
                                    fullWidth
                                />
                            </Form>
                        </CustomDialogContent>
                        <CustomDialogFooter>
                            <Button size="small" color="primary" onClick={onClose}>Cancel</Button>
                            <CustomButton
                                loading={loading}
                                variant="contained"
                                color="primary"
                                type="submit"
                                onClick={submitForm}
                            > Save</CustomButton>
                        </CustomDialogFooter>
                    </Fragment>
                )}
            </Formik>
            :
            <Box p={2} height={500} bgcolor="white">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>}
    </Dialog>
    );
}

export default CreateProductInventory;
