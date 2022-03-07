
import { useState, useEffect, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom'
import { CHILD_RESOURCE } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_rental_product_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, 'rentalManagementProduct');
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency);
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return data;
}

export const fetch_rental_cost_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, 'rentalManagementCost');
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency);
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return data;
}
