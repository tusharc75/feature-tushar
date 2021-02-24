import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetFields } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import { Box } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys } from '../../constants/helpers';
import InputField from '../../components/Helpers/InputField';

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: "100%!important",
        marginTop: 0
    },
    box: {
        backgroundColor: "#fff",
        borderRadius: 6,
        padding: theme.spacing(0.5, 1.5),
        padding: "20px 200px"
    },
}));

export default function CreateAccount() {

    const classes = useStyles();

    const { state: { user } } = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });

    useEffect(() => {
        if (user) {
            getAccountFields(user.user.brand);
        }
        // eslint-disable-next-line
    }, [user]);

    const formValidation = (values) => {
        const errors = {};
        entityData.fields.forEach((field) => {
            if (field.required && !values[field.fieldName]) {
                errors[field.fieldName] = `${field.fieldLabel} is required`;
            }
        });

        return errors;
    };

    const getAccountFields = (brandId) => {
        GetFields('Account', brandId).then(({ data }) => {

            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    return (
        <Layout>
            {
                entityData.fields.length > 0 && <Box className={classes.box}>
                    <Formik
                        initialValues={entityData.initialValues}
                        validate={formValidation}
                    >
                        {({
                            setFieldTouched,
                            values,
                            errors,
                            touched,
                            setFieldValue,
                            validateForm,
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
                                </>
                            </Form>
                        )}
                    </Formik>
                </Box>
            }

        </Layout>
    )
}
