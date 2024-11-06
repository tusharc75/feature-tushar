import { objectStore, insertUpdate, clearAll, findOne, deleteMany, findAll } from '../../../constants/indexdbhelper';
import axiosInstance from '../../../axios/axiosInstance';
import { CHILD_RESOURCE, MATERIAL_TYPE, asyncForEach, fieldServiceOrder, sidebarResource } from '../../../constants/helpers';

export const fieldServiceOrderAddOffline = async (ids) => {
    try {
        if (ids.length === 0) {
            const fieldServiceOrder = await findAll(objectStore.fieldServiceOrder);
            fieldServiceOrder?.forEach(e => {
                ids.push(e?._id)
            })
            clearAll(objectStore.fieldServiceOrder);
            clearAll(objectStore.fieldTicket);
            clearAll(objectStore.fieldTicketMaterial);
            clearAll(objectStore.resourceData);
        }
        axiosInstance().post(`${fieldServiceOrder.api}/get-all-offline-data`, { ids: ids }).then(({ data }) => {
            asyncForEach(data?.data?.fieldServiceOrder, async (element) => {
                insertUpdate(objectStore.fieldServiceOrder, element._id, element);
            })
            asyncForEach(data?.data?.fieldTicket, async (element) => {
                insertUpdate(objectStore.fieldTicket, element._id, element);
            })
            asyncForEach(data?.data?.fieldTicketMaterial, async (element) => {
                insertUpdate(objectStore.fieldTicketMaterial, element._id, element);
            })
            asyncForEach(data?.data?.fieldTicketCost, async (element) => {
                insertUpdate(objectStore.fieldTicketMaterial, element._id, { ...element, type: MATERIAL_TYPE.manualEntry });
            })
            asyncForEach(data?.data?.fieldTicketLogs, async (element) => {
                insertUpdate(objectStore.fieldTicketLogs, element._id, element);
            })
        });
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

export const fieldServiceOrderClearOffline = async (ids: any[] = []) => {
    if (!ids.length) {
        clearAll(objectStore.fieldServiceOrder);
        clearAll(objectStore.fieldTicket);
        clearAll(objectStore.fieldTicketMaterial);
        clearAll(objectStore.fieldTicketLogs);
    } else {
        const fieldTicketIdsToDelete = [];
        const fieldTicketMaterialIdsToDelete = [];
        const fieldTicketLogsIdsToDelete = [];
        for (const id of ids) {
            const fieldServiceOrder = await findOne(objectStore.fieldServiceOrder, id);
            fieldServiceOrder?.fieldTickets?.forEach((fieldTicket: any) => {
                fieldTicketIdsToDelete.push(fieldTicket?._id);
                fieldTicket?.material?.forEach((fieldTicketMaterial: any) => {
                    fieldTicketMaterialIdsToDelete.push(fieldTicketMaterial?._id);
                })
            })
        }
        const fieldTicketLogs = await findAll(objectStore.fieldTicketLogs);
        fieldTicketLogs?.forEach(e => {
            if (fieldTicketIdsToDelete?.includes(e?.fieldTicketId)) {
                fieldTicketLogsIdsToDelete.push(e?._id)
            }
        }) 
        deleteMany(objectStore.fieldServiceOrder, ids);
        deleteMany(objectStore.fieldTicket, fieldTicketIdsToDelete);
        deleteMany(objectStore.fieldTicketMaterial, fieldTicketMaterialIdsToDelete);
        deleteMany(objectStore.fieldTicketLogs, fieldTicketLogsIdsToDelete);
    }
}

