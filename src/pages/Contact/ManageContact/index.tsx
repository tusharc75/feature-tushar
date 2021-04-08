import React, { useContext, useEffect, useState } from 'react';
import ManageContact from './ManageContact'
import { getObjKeys, initializeDropdownById, sidebarResource } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from '../../../axios/axiosInstance'
import { removeEmptyKeys } from '../../../constants/helpers'
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

export default function ManageContactMain(props) {
    const toastConfig = useContext(CustomToastContext);

    const { open, onClose, onSuccess, accountId, contactResource, contactApi } = props
    const { state: { user, selectedEntity } }: any = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getContactFields();

    }, [user]);

    const getContactFields = () => {
        setLoading(true)
        axiosInstance().get(`/field?resource=${sidebarResource[contactResource]}`).then(({ data: { data } }) => {
            const newFields = [];
            data.filter(d => d.isCreate).map((_f) => {

                //  If this dialog opens from account details screen, make that account preselected
                if (accountId) {
                    _f = initializeDropdownById(_f, "accountName", accountId);
                }

                newFields.push(_f.fieldData)
            });

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
            setLoading(false)
        }).catch(err => setLoading(false))
    };

    const handleCreateContact = (values, saveAndNew, setValues) => {
        setLoading(true)
        axiosInstance().post(`/${contactApi}`, removeEmptyKeys(values)).then(({ data }) => {
            onClose({ fetch: true })
            onSuccess({ fetch: true })
            toastConfig.setToastConfig({ open: true, type: "success", message: data.message })
            setLoading(false);
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
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
    //         handleCreateContact(values, saveAndNew, setValues)
    //         setErrors({});
    //     }

    // }

    return <ManageContact
        loading={loading}
        open={open}
        isNew={true}
        onClose={onClose}
        entityData={entityData}
        handleSubmit={handleCreateContact}
    />;
}
