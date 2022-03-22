
import { objectStore, insertUpdate, findOne, findAll, clearAll } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { rentalManagement } from '../../constants/helpers';

export const rentalJobOfflineUpdate = async (ids) => {
    try {
        if (ids.length === 0) {
            const rentalManagement = await findAll(objectStore.rentalManagement);
            rentalManagement?.forEach(e => {
                ids.push(e?._id)
            })
            await clearAll(objectStore.rentalManagement)
            await clearAll(objectStore.deliveryTicket)
        }
        await axiosInstance().post(`${rentalManagement.api}/get-all-offline-data`, { ids: ids }).then(({ data: { data } }) => {
            data?.rentalManagement?.forEach(element => {
                insertUpdate(objectStore.rentalManagement, element._id, element);
            });
            data?.deliveryTicket?.forEach(element => {
                insertUpdate(objectStore.deliveryTicket, element._id, element);
            });
        })
        return true
    }
    catch (e) {
    }
};

export const getRentalProductAssets = async (id) => {
    const rentalManagement = await findOne(objectStore.rentalManagement, id);
    return rentalManagement?.productInventory?.map(u => ({ ...u.inventoryDetail }))
};

export const getRentalDeliveryTicket = async (id) => {
    try {
        const deliveryTicket = await findAll(objectStore.deliveryTicket);
        const result: any = []
        deliveryTicket.forEach(e => {
            if (e?.rentalJob?.optionValue === id) {
                result.push(e)
            }
        })
        return result
    }
    catch (e) {
    }
};

export const updateRentalProcessStatus = async (id, processStatus) => {
    try {
        const rentalManagement = await findOne(objectStore.rentalManagement, id);
        rentalManagement.processStatus = processStatus;
        await insertUpdate(objectStore.rentalManagement, id, rentalManagement);
        return true;
    }
    catch (e) {
        return false;
    }
}


export const updateRentalAssetStatus = async (id, status, asset) => {
    try {
        const rentalManagement = await findOne(objectStore.rentalManagement, id);
        rentalManagement?.productInventory?.forEach(element => {
            if (element?.inventoryDetail && asset.includes(element?.inventory)) {
                element.inventoryDetail.status = status;
            }
        });
        await insertUpdate(objectStore.rentalManagement, id, rentalManagement);
        return true;
    }
    catch (e) {
        return false;
    }
}


export const updateRentalProductStatus = async (id, status, product) => {
    try {
        const rentalManagement = await findOne(objectStore.rentalManagement, id);
        rentalManagement?.material?.forEach(element => {
            if (product.includes(element?.materialId)) {
                element.status = status;
            }
        });
        await insertUpdate(objectStore.rentalManagement, id, rentalManagement);
        return true;
    }
    catch (e) {
        return false;
    }
}

