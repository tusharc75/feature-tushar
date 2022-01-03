
import { objectStore, insertUpdate, findOne, findAll } from '../../constants/indexdbhelper';
import { updateRentalAssetStatus } from '../RentalManagement/rentalOfflineHelper';
import { INVENTORY_STATUS, DELIVERY_TICKET_STATUS } from "../../constants/helpers";

export const createDeliveryTicketOffline = async (data, values) => {
    try {
        const _id: any = (Math.floor(Math.random() * 1000000)).toString()
        if (!data.signatures) {
            data.signatures = []
        }
        if (!values.signatures) {
            values.signatures = []
        }
        await insertUpdate(objectStore.deliveryTicket, _id, { ...data, _id });
        await insertUpdate(objectStore.offlineDataSync, _id, { type: "deliveryTicket", data: { ...values, _id } });
        await updateRentalAssetStatus(data?.rentalJob?.optionValue,
            INVENTORY_STATUS.readyToShip, data?.productInventory?.map((e) => e.optionValue))
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
                deliveryTicket.status = DELIVERY_TICKET_STATUS.indTransit
                deliveryTicket.signatures = signatures
                await updateofflineDataSync(id, { status: DELIVERY_TICKET_STATUS.indTransit, signatures: signatures })
                await updateRentalAssetStatus(deliveryTicket?.rentalJob?.optionValue,
                    INVENTORY_STATUS.indTransit,
                    deliveryTicket?.productInventory?.map((e) => e.optionValue))
            }
            else {
                deliveryTicket.status = DELIVERY_TICKET_STATUS.delivered
                deliveryTicket.signatures = signatures
                await updateofflineDataSync(id, { status: DELIVERY_TICKET_STATUS.delivered, signatures: signatures })
                await updateRentalAssetStatus(deliveryTicket?.rentalJob?.optionValue,
                    deliveryTicket.ticketType === "Loading" ? INVENTORY_STATUS.inUse : INVENTORY_STATUS.underReview,
                    deliveryTicket?.productInventory?.map((e) => e.optionValue))
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

export const updateofflineDataSync = async (id, data) => {
    try {
        var offlineDataSync = await findOne(objectStore.offlineDataSync, id);
        offlineDataSync.data = { ...offlineDataSync.data, ...data }
        await insertUpdate(objectStore.offlineDataSync, id, offlineDataSync);
        return true;
    }
    catch (e) {
        console.log(e)
        return false;
    }
};