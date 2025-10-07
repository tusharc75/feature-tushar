import axiosInstance from '../../axios/axiosInstance';

export const fetch_resource_view_fields = async (resource, allowedToEdit) => {

    const response: any = await axiosInstance().get(`/field?resource=${resource}&view=true`);
    let fieldData = response?.data?.data;

    if (!allowedToEdit) {
        fieldData?.forEach((e) => {
            e.fieldData.isColumnEditable = false
        })
    }

    const fieldsDataAll = fieldData;
    const fieldsDataForRead = fieldData?.filter((obj) => obj.isRead);

    return { fieldsDataAll, fieldsDataForRead };
}

export const fetch_resource_fields = async (resource, ignoreFields = []) => {

    const response: any = await axiosInstance().get(`/field?resource=${resource}`);
    let fieldData = response?.data?.data;

    fieldData = fieldData?.filter((e) => !ignoreFields.includes(e?.fieldData?.fieldName));

    const fieldsDataAll = fieldData?.map((d: any) => d.fieldData);
    const fieldsDataForCreate = fieldData?.filter((obj) => obj.isCreate).map((d: any) => d.fieldData);
    const fieldsDataForUpdate = fieldData?.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);

    return { fieldsDataAll, fieldsDataForCreate, fieldsDataForUpdate };
}

