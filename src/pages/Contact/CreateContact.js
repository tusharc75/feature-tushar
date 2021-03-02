import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetFields, CreateNewContact } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import { Box, Button } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys } from '../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import { useHistory } from "react-router-dom";
import CustomContainer from './../../components/Container'

const useStyles = makeStyles((theme) => ({
    root: {
        minHeight: "100%!important",
        marginTop: 0
    },
    box: {
        backgroundColor: "#fff",
        borderRadius: 6,
        padding: theme.spacing(0.5, 1.5),
        // padding: "20px 200px"
    },
}));

export default function CreateContact() {

    const classes = useStyles();
    const history = useHistory();
    const { state: { user } } = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [isFormSubmitted, setIsFormSubmitted] = useState(false)

    useEffect(() => {
        if (user) {
            getContactFields();
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

    const getContactFields = () => {
        GetFields('Contact').then(({ data }) => {

            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };

    const handleSave = (values) => {
        setIsFormSubmitted(true);
        CreateNewContact(values).then(() => {
            history.push({
                pathname: "/contact"
            });
        }, error => {
            setIsFormSubmitted(false);
        })
    }

    const cancel = () => {
        history.push({
            pathname: "/contact"
        })
    }

    return (
        <Layout>
            {
                entityData.fields.length > 0 &&
                <CustomContainer styles={{ marginTop: 0 }}>
                    <CustomContainer styles={{ marginTop: 0, minHeight: "100%" }} maxWidth="md">
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

                                        <Box display="flex" justifyContent="flex-end" className="gap-2">
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                color="primary"
                                                onClick={cancel}
                                            >
                                                Cancel
                                        </Button>
                                            <Button
                                                disabled={isFormSubmitted}
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => { handleSave(values) }}
                                            >
                                                Create Contact
                                        </Button>
                                        </Box>
                                    </>
                                </Form>
                            )}

                        </Formik>

                    </CustomContainer>
                </CustomContainer>
            }

        </Layout>
    )
}
