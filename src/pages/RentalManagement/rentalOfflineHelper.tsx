
import { objectStore, insertUpdate, findOne, findAll } from '../../constants/indexdbhelper';


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
        console.log(e)
    }
};