import React, { useEffect, useState } from 'react';
import Layout from "../../components/Layout";
import { GetFields } from '../../axios/index';
import { useData } from '../../StateProvider/Provider';
import { Box, Button, CircularProgress } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import { Formik, Form } from "formik";
import { getObjKeys, formValidation } from '../../constants/helpers';
import InputField from '../../components/Helpers/InputField';
import CustomButton from '../../components/Helpers/Button'
import { commonStyle } from '../Contact/CommonStyles'
import { accountPage } from '../../routes/Accounts'
import { craeteAccount, getAccountData } from '../../axios/accounts'
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
    const [isEdit, setIsEdit] = useState(false)
    const [saveAndNewLoading, setSaveAndNewLoading] = useState(false)
    const [alertData, setAlertData] = useState({})

    useEffect(() => {

        if (history?.location?.state?.accountId) {
            setIsEdit(true)
            fetchAccountData()
        }
        else if (user) {
            getAccountFields(user.user.brand);
        }
    }, [user]);

    const fetchAccountData = async () => {
        let accId = history.location.state.accountId
        try {
            let data = await getAccountData(accId)
            if (data.status === 200 && Object.keys(data.data)) {
                let initialVal = {}
                Object.keys(data.data).map(k => {
                    if (typeof data.data[k] === 'object') {
                        initialVal[k] = data.data[k].optionValue || ''
                    }
                    // if (Array.isArray(data.data[k]) && data.data[k].length) {
                    //     initialVal[k] = []
                    //     data.data[k].map(val => {
                    //         initialVal[k] = [...initialVal, val.optionValue]
                    //     })
                    // }
                })
                getAccountFields(undefined, initialVal)
            }
        }
        catch (err) {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }

    }
    const getAccountFields = (brandId, values) => {
        GetFields('Account', brandId).then(({ data }) => {
            const newFields = [];
            data.map((_f) => newFields.push(_f.fieldData));
            setEntityData({
                fields: newFields,
                initialValues: values ? values : getObjKeys("", newFields),
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

        let tempFields = entityData.fields
        tempFields.map(f => {
            let fName = f.fieldName
            if (f.type === "dropDown" && values[fName]) {
                if (f?.option && f.option.length) {
                    f.option.filter(obj => {
                        if (obj.optionValue === values[fName]) {
                            values[fName] = obj
                            return true
                        }
                    })
                }
            }
            if (f.type === "multiSelect" && values[fName] && values[fName].length > 0) {
                if (f?.option && f.option.length) {
                    f.option.map(obj => {
                        let i = values[fName].indexOf(obj.optionValue)
                        if (i >= 0) {
                            values[fName][i] = obj
                        }
                    })
                }
            }
        })
        Object.keys(values).forEach(key => {
            if (!values[key] || (typeof values[key] === 'object' && Object.keys(values[key]).length == 0)) {
                delete values[key]
            }
        })

        // if (user?.user?.brand) values.brand = user.user.brand
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
                else {
                    getAccountFields()
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
            values = getModiFiedValues(values)
            handleCreateAccount(values, saveAndNew)
            setValues(getObjKeys("", entityData.fields));
            setErrors({});
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
                entityData.fields.length > 0 ?
                    <Box className={classes.box}>
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
                                                {isEdit ? "Update" : "Save"}  and New
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
                                                {isEdit ? "Update" : "Save"}
                                            </CustomButton>
                                        </div>
                                    </>
                                </Form>
                            )}
                        </Formik>
                    </Box>
                    : <Box className={classes.box} style={{ textAlign: 'center' }}>
                        <span >  <CircularProgress /> Fetching Data</span>
                    </Box>
            }

        </Layout>
    )
}
