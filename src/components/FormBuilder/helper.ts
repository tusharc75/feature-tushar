import { sortBy } from "lodash";
import axiosInstance from "../../axios/axiosInstance";

export const getLookupResource = async () => {
    const { data: { data } } = await axiosInstance().get(`sa-formbuilder/lookup/options?type=brand`)
    return sortBy(data, ['name'])?.map((e) => { return { optionLabel: e.name, optionValue: e.value } });
}

export const getResourceField = async (resource) => {
    const { data: { data } } = await axiosInstance().get(`/field?resource=${resource}`)
    return data?.map((e) => { return { fieldName: e.fieldData.fieldName, fieldLabel: e.fieldData.fieldLabel } })
}