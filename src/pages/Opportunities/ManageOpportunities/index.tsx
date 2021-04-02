import React, { useContext, useEffect, useState } from 'react';
import ManageOpportunity from './ManageOpportunities';
import { getObjKeys, initializeDropdownById } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from '../../../axios/axiosInstance'
import { removeEmptyKeys } from '../../../constants/helpers'
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';


export default function ManageOpportunityMain(props) {
    const toastConfig = useContext(CustomToastContext);
    const { open, onClose, id,onSuccess, accountId } = props;
    const { state: { user } }: any = useData();
    const [entityData, setEntityData] = useState({
        fields: [],
        initialValues: {},
    });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        getOpportunityFields();
        // eslint-disable-next-line
    }, []);

    const getOpportunityFields = () => {
        axiosInstance().get('/field?resource=Opportunity').then(({ data: { data } }) => {

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

        }).catch(err=>setLoading(false))
    };
    const handleLoading = (action, isSaveAndNew = false) => {
        if (!isSaveAndNew) setLoading(action)
    }
    const handleCreateOpportunity = (values, saveAndNew, setValues) => {
        axiosInstance().post('/opportunity', removeEmptyKeys(values)).then(({ data }) => {
            onClose({ fetch: true })
            onSuccess({fetch:true})
            toastConfig.setToastConfig({ open: true, type: "success", message: data.message })

            handleLoading(false, saveAndNew)
        }).catch((error) => {
            setLoading(false);
            toastConfig.setToastConfig(error);
        })
    }

    return <ManageOpportunity
        open={open}
        isNew={true}
        onClose={onClose}
        entityData={entityData}
        handleSubmit={handleCreateOpportunity}
    />;



}