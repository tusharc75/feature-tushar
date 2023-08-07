import axiosInstance from "src/axios/axiosInstance";
import { CURReplaceByCurrencySingle } from "src/constants/formulaUtility";
import { CHILD_RESOURCE } from "src/constants/helpers";

export const fetch_field_ticket_material_fields = async (currency) => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketMateial}`);
    let data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}