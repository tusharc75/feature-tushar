
import { CHILD_RESOURCE } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_po_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.purchaseOrderProduct}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

export const fetch_po_service_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.purchaseOrderService}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

export const fetch_po_cost_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.purchaseOrderCost}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}

