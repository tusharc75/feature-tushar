import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetFields } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import { Box, Button } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, formValidation } from '../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import CustomButton from '../../components/Helpers/Button'
import { commonStyle } from './CommonStyles'
import { useHistory } from 'react-router-dom'
import { contactPage } from '../../routes/Contacts'
import "../Account/account.css"

const useStyles = makeStyles((theme) => ({
    ...commonStyle(theme)
}));

export default function CreateContact() {

    const classes = useStyles();
    const history = useHistory();
    const { state: { user } } = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)
    const [ContactData, setContactData] = useState({})

    useEffect(() => {
        if (user) {
            getContactFields(user.user.brand);
        }
    }, [user]);

    const getContactFields = (brandId) => {
        GetFields('Contact', brandId).then(({ data }) => {

            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    const goToBackPage = () => {
        history.push({
            pathname: contactPage.path
        })
    }

    const handleSubmit = (setTouched, values, setValues, setErrors, saveAndNew) => {
        setLoading(true)
        const errors = formValidation(values, entityData.fields);
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            console.log("handleSubmit ~ values", values)
            setContactData(values)
            setValues(getObjKeys("", entityData.fields));
            setErrors({});
            if (saveAndNew) {

            }
            else {
                goToBackPage()
            }
        }
        // setLoading(false)
    }
    return (
        <Layout>
            {
                entityData.fields.length > 0 && <Box className={classes.box}>
                    <Formik
                        initialValues={entityData.initialValues}
                        validate={(values) => formValidation(values, entityData.fields)}
                    >
                        {({
                            setValues,
                            setErrors,
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            setFieldTouched,
                            validateForm
                        }) => (
                            <Form>
                                <>
                                    <InputField
                                        errors={errors}
                                        values={values}
                                        setFieldValue={setFieldValue}
                                        touched={touched}
                                        fieldsData={entityData.fields}
                                        size="small"
                                        fullWidth
                                    />
                                    <div className="footer">
                                        <Button onClick={goToBackPage} variant="outlined" color="primary">
                                            Cancel
                                    </Button>
                                        <CustomButton
                                            loading={loading}
                                            disabled={loading}
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => handleSubmit(setFieldTouched, values, setValues, setErrors, true)}
                                        >
                                            Save and New
                                     </CustomButton>
                                        <CustomButton
                                            loading={loading}
                                            disabled={loading}
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleSubmit(setFieldTouched, values, setValues, setErrors)}
                                        >
                                            Save
                                     </CustomButton>
                                    </div>
                                </>
                            </Form>
                        )}
                    </Formik>
                </Box>
            }

        </Layout>
    )
}
