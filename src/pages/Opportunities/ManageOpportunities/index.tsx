import React, { useContext, useEffect, useState } from 'react';
import ManageOpportunity from './ManageOpportunities';
import { getObjKeys } from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import _ from 'lodash'
import axiosInstance from '../../../axios/axiosInstance'
import { removeEmptyKeys } from '../../../constants/helpers'
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';


export default function ManageOpportunityMain(props){
    const toastConfig=useContext(CustomToastContext);
    const {open, onClose,id}=props;
    const {state:{user}}:any=useData();
    const [entityData,setEntityData]=useState({
        fields:[],
        initialValues:{},
    });
    const [loading, setLoading]=useState(false);
    useEffect(() => {
        getOpportunityFields();
        // eslint-disable-next-line
    }, []);

    const getOpportunityFields = () => {
        axiosInstance().get('/field?resource=Opportunity').then(({ data: { data } }) => {

            const newFields = [];
            data.filter(d => d.isCreate).map((_f) => newFields.push(_f.fieldData));

            setEntityData({
                fields: newFields,
                initialValues: getObjKeys("", newFields),
            });
        });
    };
    const handleLoading = (action, isSaveAndNew = false) => {
        if (!isSaveAndNew) setLoading(action)
    }
    const handleCreateOpportunity = (values, saveAndNew, setValues) => {
        axiosInstance().post('/opportunity', removeEmptyKeys(values)).then(({ data }) => {
            onClose({ fetch: true })
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