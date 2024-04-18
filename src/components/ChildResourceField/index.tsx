import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_child_resource_fields = async (childResource, currency, allowedToEdit) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${childResource}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    if (!allowedToEdit) {
        data?.forEach((e) => {
            e.isColumnEditable = false;
        });
    }
    return data;
}