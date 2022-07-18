
import { CHILD_RESOURCE } from '../../constants/helpers';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_quotation_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationProduct}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    // var isRateRequired = false
    // data.forEach(element => {
    //     if (element.fieldName === "price" && element.required) {
    //         isRateRequired = true;
    //     }
    // });
    // if (!isRateRequired) {
    //     data = data.filter((e) => e.sectionName !== "Pricing Information")
    // }
    return data;
}

export const fetch_quotation_cost_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationCost}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    // var isRateRequired = false
    // data.forEach(element => {
    //     if (element.fieldName === "price" && element.required) {
    //         isRateRequired = true;
    //     }
    // });
    // if (!isRateRequired) {
    //     data = data.filter((e) => e.sectionName !== "Pricing Information")
    // }
    return data;
}

export const fetch_quotation_service_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.quotationService}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
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
