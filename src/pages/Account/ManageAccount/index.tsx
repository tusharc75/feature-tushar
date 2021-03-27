import React, { useEffect, useState } from 'react';
import ManageAccount from './ManageAccount'
import { getObjKeys, formValidation } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomEventEmitter } from '../../../axios/events';
import { removeEmptyKeys } from '../../../constants/helpers'

export default function ManageAccountMain(props) {

    const { open, onClose, id } = props
    const { state: { user } }: any = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)

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

    const handleCreateAccount = (values, saveAndNew, setValues) => {
        axiosInstance().post('/account', removeEmptyKeys(values)).then(({ data }) => {
            onClose({ fetch: true })
            CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });

            handleLoading(false, saveAndNew)
        }).catch((error) => {
            setLoading(false);
        })
    }
    // const handleSubmit = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
    //     const errors = formValidation(values, _.cloneDeep(entityData.fields));
    //     if (Object.keys(errors).length) {
    //         entityData.fields.forEach((input) => {
    //             if (input.required) {
    //                 setTouched(input.fieldName, true);
    //             }
    //         });
    //     } else {
    //         handleLoading(true, saveAndNew)
    //         handleCreateAccount(values, saveAndNew, setValues)
    //         setErrors({});
    //     }

    // }

    return <ManageAccount
        open={open}
        isNew={true}
        onClose={onClose}
        entityData={entityData}
        handleSubmit={handleCreateAccount}
    />;
}
