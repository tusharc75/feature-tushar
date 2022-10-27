
import { CHILD_RESOURCE } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_invoice_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.invoiceProduct}`);
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
