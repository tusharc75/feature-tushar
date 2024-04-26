import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';
import { findOne, objectStore } from 'src/constants/indexdbhelper';
import { camelCase } from 'lodash';

export const fetch_child_resource_fields = async (childResource, currency, allowedToEdit, isOffline= false) => {
    let data;
    if (isOffline && objectStore[camelCase(childResource)]) {
        data = await findOne(objectStore.resource, objectStore[camelCase(childResource)]);
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