import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';
import { findOne, objectStore } from 'src/constants/indexdbhelper';

export const fetch_child_resource_fields = async (childResource, currency, allowedToEdit, isOffline = false) => {
    let data;
    if (isOffline) {
        data = await findOne(objectStore.resource, childResource);
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${childResource}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    if (!allowedToEdit) {
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
    }
    return data;
}

export const fetch_child_resource_fields_perm = async (childResource, currency, allowedToEdit, isOffline = false) => {
    let data;
    if (isOffline) {
        data = await findOne(objectStore.resource, childResource);
    } else {
        const response = await axiosInstance().get(`/field?resource=${childResource}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data?.map(d => ({ ...d?.fieldData, isRead: d?.isRead })), currency ? currency : "USD");
    if (!allowedToEdit) {
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
    }
    return data;
}