import { sortBy } from "lodash";
import axiosInstance from "../../axios/axiosInstance";

export const getLookupResource = async () => {
    const { data: { data } } = await axiosInstance().get(`sa-formbuilder/lookup/options?type=brand`)
    return sortBy(data, ['name'])?.map((e) => { return { optionLabel: e.name, optionValue: e.value } });
}

export const getResourceField = async (resource, view = false) => {
    const { data: { data } } = await axiosInstance().get(`/field?resource=${resource}&view=${view}`)
    return data?.map((e) => { return { fieldName: e.fieldData.fieldName, fieldLabel: e.fieldData.fieldLabel, lookup: e.fieldData.lookup } })
}

export const getEntity = async (brandId) => {
    const { data: { data } } = await axiosInstance().get(`/entity`)
    return data?.map((data) => ({ optionValue: data._id, optionLabel: data?.entityName }))
}

export const getLookupOption = async (brandId, resource) => {
    const { data: { data } } = await axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=` + resource)
    return data[resource] || [];
}

export const LOGIC = {
    AND: 'AND',
    OR: 'OR',
}