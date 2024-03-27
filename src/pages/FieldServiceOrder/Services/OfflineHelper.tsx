import { objectStore, insertUpdate, findOne, findAll, clearAll } from '../../../constants/indexdbhelper';
import axiosInstance from '../../../axios/axiosInstance';
import { asyncForEach, fieldServiceOrder } from '../../../constants/helpers';

export const fieldServiceOfflineUpdate = async (ids) => {
    try {
        const { data } = await axiosInstance().post(`${fieldServiceOrder.api}/get-all-offline-data`, { ids: ids });
        await asyncForEach(data?.data?.fieldServiceOrder, async (element) => {
            await insertUpdate(objectStore.fieldServiceOrder, element._id, element);
        })
        await asyncForEach(data?.data?.fieldTicket, async (element) => {
            await insertUpdate(objectStore.fieldTicket, element._id, element);
        })
        return true
    }
    catch (e) {
        console.log(e);
    }
};