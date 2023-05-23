import { sortBy } from "lodash";
import axiosInstance from "../../axios/axiosInstance";

export const getLookupResource = async () => {
    const { data: { data } } = await axiosInstance().get(`sa-formbuilder/lookup/options?type=brand`)
    return sortBy(data, ['name']);
}