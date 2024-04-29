import { objectStore, insertUpdate, findOne, findAll, clearAll } from '../../../constants/indexdbhelper';
import axiosInstance from '../../../axios/axiosInstance';
import { MATERIAL_TYPE, asyncForEach, fieldServiceOrder } from '../../../constants/helpers';

export const fieldServiceOfflineUpdate = async (ids) => {
    try {
        const { data } = await axiosInstance().post(`${fieldServiceOrder.api}/get-all-offline-data`, { ids: ids });
        await asyncForEach(data?.data?.fieldServiceOrder, async (element) => {
            await insertUpdate(objectStore.fieldServiceOrder, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicket, async (element) => {
            await insertUpdate(objectStore.fieldTicket, element._id, element);
        })
        await asyncForEach(data?.data?.serviceMaster, async (element) => {
            await insertUpdate(objectStore.serviceMaster, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicketMaterial, async (element) => {
            await insertUpdate(objectStore.fieldTicketMaterial, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicketCost, async (element) => {
            await insertUpdate(objectStore.fieldTicketMaterial, element._id, {...element, type: MATERIAL_TYPE.manualEntry});
        })
        await asyncForEach(data?.data?.product, async (element) => {
            await insertUpdate(objectStore.product, element._id, element);
        })
        return true
    }
    catch (e) {
    }
};