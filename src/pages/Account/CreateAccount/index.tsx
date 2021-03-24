import React, { useEffect, useState } from 'react';
import CreateAccount from './CreateAccount'
import { getErrorMessage } from '../../../services/util'
import { getObjKeys, formValidation } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from './../../../axios/axiosInstance'
import { CustomEventEmitter } from './../../../axios/events';


export default function CreateAccountMain(props) {

    const { open, onClose, id } = props
    const { state: { user } }: any = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)
    const [alertData, setAlertData] = useState({})

    useEffect(() => {
        if (id) {
            setLoading(true)
            axiosInstance().get(`/field?resource=Account`).then(({ data: { data } }) => {
                const newFields = [];
                data.filter(d => d.isCreate).map((_f) => newFields.push(_f.fieldData));

                axiosInstance().get(`/account/clone/${id}`).then(({ data: dataToClone }) => {
                    setEntityData({
                        fields: newFields,
                        initialValues: dataToClone.data ? dataToClone.data : getObjKeys("", newFields),
                    });
                    setLoading(false);
                }, error => {
                    setLoading(false);
                });
            });
        }
        else {
            getAccountFields();
        }
    }, [user]);

    const getAccountFields = () => {
        setLoading(true)
        axiosInstance().get(`/field?resource=Account`).then(({ data: { data } }) => {
            const newFields = [];
            data.filter(d => d.isCreate).map((_f) => newFields.push(_f.fieldData));
            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
            setLoading(false)
        }).catch(err => setLoading(false))
    };

    const handleLoading = (action, isSaveAndNew = false) => {
        if (!isSaveAndNew) setLoading(action)
    }

    const getModiFiedValues = values => {
        values = { ...values }

        if (values.employees === "") {
            delete values.employees
        }
        else {
            values.employees = parseInt(values.employees)
        }

        let tempFields = _.cloneDeep(entityData.fields)
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
            if (!values[key] || (typeof values[key] === 'object' && Object.keys(values[key]).length === 0)) {
                delete values[key]
            }
        })

        // if (user?.user?.brand) values.brand = user.user.brand
        return values
    }

    const showErroeMes = (err, saveAndNew) => {
        let errMes = getErrorMessage(err)
        if (errMes) {
            handleSnackbar(errMes, 'error', true)
        }
        handleLoading(false, saveAndNew)
    }

    const handleCreateAccount = async (values, saveAndNew, setValues) => {
        try {
            axiosInstance().post('/account', values).then(({ data }) => {
                onClose({ fetch: true })
                setValues(getObjKeys("", _.cloneDeep(entityData.fields)));

                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });

                handleLoading(false, saveAndNew)
            }).catch((error) => {
                setLoading(false);
            })
        }
        catch (err) {
            showErroeMes(err, saveAndNew)
        }
    }
    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };
    const handleSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
        const errors = formValidation(values, _.cloneDeep(entityData.fields));
        if (Object.keys(errors).length) {
            entityData.fields.forEach((input) => {
                if (input.required) {
                    setTouched(input.fieldName, true);
                }
            });
        } else {
            handleLoading(true, saveAndNew)
            values = getModiFiedValues(values)
            handleCreateAccount(values, saveAndNew, setValues)
            setErrors({});
        }

    }

    return (<CreateAccount
        open={open}
        onClose={onClose}
        alertData={alertData}
        handleSnackbar={handleSnackbar}
        entityData={entityData}
        loading={loading}
        handleSubmit={handleSubmit}
    />
    );
}
