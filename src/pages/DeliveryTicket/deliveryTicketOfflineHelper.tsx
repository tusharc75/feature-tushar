
import { objectStore, insertUpdate, findOne, findAll } from '../../constants/indexdbhelper';
import { updateRentalAssetStatus } from '../RentalManagement/rentalOfflineHelper';
import { INVENTORY_STATUS } from "../../constants/helpers";

export const createDeliveryTicketOffline = async (data) => {
    try {
        const _id: any = (Math.floor(Math.random() * 1000000)).toString()
        if (!data.signatures) {
            data.signatures = []
        }
        await insertUpdate(objectStore.deliveryTicket, _id, { ...data, _id });
        await insertUpdate(objectStore.offlineDataSync, _id, { ...data, _id });
        await updateRentalAssetStatus(data?.rentalJob?.optionValue, INVENTORY_STATUS.readyToShip)
        return true;
    }
    catch (e) {
        console.log(e)
        return false;
    }
};

export const updateSignatureOffline = async (id, signatures) => {
    try {
        const deliveryTicket = await findOne(objectStore.deliveryTicket, id);
        signatures.forEach(element => {
            if (!element.date) {
                element.date = new Date()
            }
        });
        if (deliveryTicket.signatures) {
            if (deliveryTicket.signatures.length === 0) {
                deliveryTicket.status = "In-Transit"
                deliveryTicket.signatures = signatures
                await updateRentalAssetStatus(deliveryTicket?.rentalJob?.optionValue, INVENTORY_STATUS.indTransit)
            }
            else {
                deliveryTicket.status = "Delivered"
                deliveryTicket.signatures = signatures
                await updateRentalAssetStatus(deliveryTicket?.rentalJob?.optionValue, deliveryTicket.ticketType === "Loading" ? INVENTORY_STATUS.inUse : INVENTORY_STATUS.underRevives)
            }
        }
        await insertUpdate(objectStore.deliveryTicket, id, deliveryTicket);
        return true;
    }
    catch (e) {
        console.log(e)
        return false;
    }
};