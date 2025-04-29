import axiosInstance from '../../axios/axiosInstance';

export const fetch_resource_fields = async (resource, ignoreFields = []) => {

    const response: any = await axiosInstance().get(`/field?resource=${resource}`);
    let fieldData = response?.data?.data;

    fieldData = fieldData?.filter((e) => !ignoreFields.includes(e?.fieldData?.fieldName));

    const fieldsDataAll = fieldData?.map((d: any) => d.fieldData);
    const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
    const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

    return { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate };
}

