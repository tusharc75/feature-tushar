import { objectStore, insertUpdate, clearAll, findOne, deleteMany } from '../../../constants/indexdbhelper';
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
        axiosInstance().get(`/field?resource=${CHILD_RESOURCE.fieldTicketMateial}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, CHILD_RESOURCE.fieldTicketMateial, data);
        });
        axiosInstance().get(`/field?resource=${CHILD_RESOURCE.fieldTicketCost}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, CHILD_RESOURCE.fieldTicketCost, data);
        });
        axiosInstance().get(`/field?resource=${CHILD_RESOURCE.fieldTicketSubmit}`).then(({ data: { data } }) => {
            insertUpdate(objectStore.resource, CHILD_RESOURCE.fieldTicketSubmit, data);
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

export const fieldServiceOrderClearOffline = async (ids: any []= []) => {
    if(!ids.length) {
        clearAll(objectStore.fieldServiceOrder);
        clearAll(objectStore.fieldTicket);
        clearAll(objectStore.fieldTicketMaterial);
    } else {
        const fieldTicketIdsToDelete = [];
        const fieldTicketMaterialIdsToDelete = [];
        for(const id of ids) {
            const fieldServiceOrder = await findOne(objectStore.fieldServiceOrder, id);
            fieldServiceOrder?.fieldTickets?.forEach((fieldTicket: any) => {
                fieldTicketIdsToDelete.push(fieldTicket?._id);
                fieldTicket?.material?.forEach((fieldTicketMaterial: any) => {
                    fieldTicketMaterialIdsToDelete.push(fieldTicketMaterial?._id);
                })
            })
        }
        deleteMany(objectStore.fieldServiceOrder, ids);
        deleteMany(objectStore.fieldTicket, fieldTicketIdsToDelete);
        deleteMany(objectStore.fieldTicketMaterial, fieldTicketMaterialIdsToDelete);
    }  
}

