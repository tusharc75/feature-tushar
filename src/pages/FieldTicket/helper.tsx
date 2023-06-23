import axiosInstance from "src/axios/axiosInstance";
import { CURReplaceByCurrencySingle } from "src/constants/formulaUtility";
import { CHILD_RESOURCE } from "src/constants/helpers";
import { findOne, objectStore } from "src/constants/indexdbhelper";

export const fetch_field_ticket_material_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, 'fieldTicketMaterial');
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketMateial}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    const allFields = [...data];
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return { fields: data, allFields: allFields };
}