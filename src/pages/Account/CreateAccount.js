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
import { commonStyle } from '../Contact/CommonStyles'
import { accountPage } from '../../routes/Accounts'
import { craeteAccount } from '../../axios/accounts'
import { useHistory } from 'react-router-dom'
import CustomToast from '../../components/Helpers/CustomToast'
import { getErrorMessage } from '../../services/util'
import "./account.css"

const useStyles = makeStyles((theme) => ({
    ...commonStyle(theme)
}));

let parentAccount
export default function CreateAccount() {

    const classes = useStyles();
    const history = useHistory();
    const { state: { user } } = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)
    const [saveAndNewLoading, setSaveAndNewLoading] = useState(false)
    const [alertData, setAlertData] = useState({})


    useEffect(() => {
        if (user) {
            getAccountFields(user.user.brand);
        }
    }, [user]);

    // const formValidation = (values) => {
    //     const errors = {};
    //     entityData.fields.forEach((field) => {
    //         if (field.required && !values[field.fieldName]) {
    //             errors[field.fieldName] = `${field.fieldLabel} is required`;
    //         }
    //     });

    //     return errors;
    // };

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

    const goToBackPage = () => {
        history.push({
            pathname: accountPage.path
        })
    }

    const handleLoading = (action, isSaveAndNew = false) => {
        if (isSaveAndNew) {
            setSaveAndNewLoading(action)
        }
        else {
            setLoading(action)
        }
    }

    const getModiFiedValues = values => {
        values = { ...values }
        if (values.employees === "") {
            delete values.employees
        }
        else {
            values.employees = parseInt(values.employees)
        }

        Object.keys(values).forEach(key => {
            if (["--Select--", "--None--"].indexOf(values[key]) >= 0) {
                delete values[key]
            }
        })

        if (user?.user?.brand) values.brand = user.user.brand
        return values
    }

    const handleCreateAccount = async (values, saveAndNew) => {
        try {
            let data = await craeteAccount(values)
            if (data.status === 200) {
                handleSnackbar(data.message, 'success', true)
                if (!saveAndNew) {
                    goToBackPage()
                }
                handleLoading(false, saveAndNew)
            }
        }
        catch (err) {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
            handleLoading(false, saveAndNew)
        }
    }
    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };
    const handleSubmit = async (setTouched, values, setValues, setErrors, saveAndNew) => {
        handleLoading(true, saveAndNew)
        const errors = formValidation(values, entityData.fields);
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            // console.log("handleSubmit ~ values", values)
            values = getModiFiedValues(values)
            handleCreateAccount(values, saveAndNew)
            setValues(getObjKeys("", entityData.fields));
            setErrors({});
        }

    }
    const searchParentAccount = value => {
        // if (parentAccount) {
        //     clearTimeout(parentAccount);
        // }

        // parentAccount = setTimeout(async () => {
        //     let data = await GetAccounts({ brand: user.user.brand, search: value })
        //     populateFieldsData(data)
        // }, 300);
        populateFieldsData()
    }
    const populateFieldsData = data => {
        // if (data && data.length > 0){

        // }
        let temp = entityData.fields
        if (temp && temp.length > 0) {
            temp = temp.map(obj => {
                if (obj.fieldName === "parentAccount") {
                    obj.option = [...obj.option,
                    { optionLabel: "test account", order: 2, default: false }
                    ]
                }
                return obj
            })
        }

    }
    const handleFields = (field, value) => {
        if (field === "parentAccount" && value.length > 2) {
            searchParentAccount(value)
        }
    }
    return (
        <Layout>
            {
                alertData ? <CustomToast
                    open={alertData.open || false}
                    close={() => handleSnackbar('', '', false)}
                    errorMsg={alertData.errorMsg || ''}
                    type={alertData.type || ''}
                /> : null
            }
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
                                        onTextChange={handleFields}
                                        touched={touched}
                                        fieldsData={entityData.fields}
                                        size="small"
                                        fullWidth
                                    />
                                    <div className="footer">
                                        <Button onClick={goToBackPage} variant="outlined" color="primary" >
                                            Cancel
                                    </Button>
                                        <CustomButton
                                            loading={saveAndNewLoading}
                                            disabled={saveAndNewLoading}
                                            style={{ float: "right" }}
                                            variant="contained"
                                            color="primary"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleSubmit(setFieldTouched, values, setValues, setErrors, true)
                                            }}
                                        >
                                            Save and New
                                     </CustomButton>
                                        <CustomButton
                                            loading={loading}
                                            disabled={loading}
                                            style={{ float: "right" }}
                                            variant="contained"
                                            color="primary"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                handleSubmit(setFieldTouched, values, setValues, setErrors, false)
                                            }}
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
