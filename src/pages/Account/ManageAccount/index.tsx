import React, { useContext, useEffect, useState } from 'react';
import ManageAccount from './ManageAccount'
import { getObjKeys } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from '../../../axios/axiosInstance'
import { removeEmptyKeys } from '../../../constants/helpers'
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

export default function ManageAccountMain(props) {
    const toastConfig = useContext(CustomToastContext);

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

    const handleCreateAccount = (values, saveAndNew, setValues) => {
        setLoading(false);
        axiosInstance().post('/account', removeEmptyKeys(values)).then(({ data }) => {
            onClose({ fetch: true })
            toastConfig.setToastConfig({ open: true, type: "success", errorMsg: data.message })
            setLoading(false);
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        })
    }

    return <ManageAccount
        open={open}
        isNew={true}
        onClose={onClose}
        entityData={entityData}
        handleSubmit={handleCreateAccount}
    />;
}
