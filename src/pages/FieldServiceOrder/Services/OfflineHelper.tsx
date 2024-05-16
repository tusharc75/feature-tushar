import { objectStore, insertUpdate, clearAll } from '../../../constants/indexdbhelper';
import axiosInstance from '../../../axios/axiosInstance';
import { CHILD_RESOURCE, MATERIAL_TYPE, asyncForEach, fieldServiceOrder, sidebarResource } from '../../../constants/helpers';

export const fieldServiceOrderAddOffline = async (ids) => {
    try {
        const { data } = await axiosInstance().post(`${fieldServiceOrder.api}/get-all-offline-data`, { ids: ids });
        await asyncForEach(data?.data?.fieldServiceOrder, async (element) => {
            await insertUpdate(objectStore.fieldServiceOrder, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicket, async (element) => {
            await insertUpdate(objectStore.fieldTicket, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicketMaterial, async (element) => {
            await insertUpdate(objectStore.fieldTicketMaterial, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicketCost, async (element) => {
            await insertUpdate(objectStore.fieldTicketMaterial, element._id, { ...element, type: MATERIAL_TYPE.manualEntry });
        })
        await insertUpdate(objectStore.resourceData, sidebarResource.serviceMaster, data?.data?.serviceMaster);
        await insertUpdate(objectStore.resourceData, sidebarResource.product, data?.data?.product);

        axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, sidebarResource.fieldTicket, data);
        });
        axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketMateial}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, CHILD_RESOURCE.fieldTicketMateial, data);
        });
        axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketCost}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, CHILD_RESOURCE.fieldTicketCost, data);
        });
        axiosInstance().get(`/field?resource=${sidebarResource.serviceMaster}&view=true`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, sidebarResource.serviceMaster, data);
        });
        axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, sidebarResource.product, data);
        });
        axiosInstance().put(`/field/find-field-labels`, { fields: [{ resource: 'Product', fieldNames: ['productName', 'productNumber', 'productDescription'] }] }).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, 'fieldTicketMaterialProduct', data);
        });
        return true
    }
    catch (e) {
    }
};

export const fieldServiceOrderClearOffline = async () => {
    await clearAll(objectStore.fieldServiceOrder);
    await clearAll(objectStore.fieldTicket);
    await clearAll(objectStore.fieldTicketMaterial);
}

