
import { objectStore, insertUpdate, findOne, findAll } from '../../constants/indexdbhelper';
import { updateRentalAssetStatus } from '../RentalManagement/rentalOfflineHelper';
import { getObjKeysWithValues, INVENTORY_STATUS, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE } from "../../constants/helpers";

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
        const offlineStatusLog = [{
            status: "New",
            date: new Date()
        }]
        await insertUpdate(objectStore.offlineDataSync, _id, { type: "deliveryTicket", data: { ...values, _id, offlineStatusLog } });

        var assetStatus = INVENTORY_STATUS.readyToShip;
        if (data?.status === DELIVERY_TICKET_STATUS.new) {
            assetStatus = INVENTORY_STATUS.readyToShip
        }
        else if (data?.status === DELIVERY_TICKET_STATUS.delivered && data?.ticketType === DELIVERY_TICKET_TYPE.loading) {
            assetStatus = INVENTORY_STATUS.inUse
        }
        else if (data?.status === DELIVERY_TICKET_STATUS.delivered && [DELIVERY_TICKET_TYPE.receiving, DELIVERY_TICKET_TYPE.return].includes(data?.ticketType)) {
            assetStatus = INVENTORY_STATUS.underReview
        }
        await updateRentalAssetStatus(data?.rentalJob?.optionValue, assetStatus, data?.productInventory?.map((e) => e.optionValue))
        return true;
    }
    catch (e) {
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
                    deliveryTicket.ticketType === DELIVERY_TICKET_TYPE.loading ? INVENTORY_STATUS.inUse : INVENTORY_STATUS.underReview,
                    deliveryTicket?.productInventory?.map((e) => e.optionValue))
            }
        }
        await insertUpdate(objectStore.deliveryTicket, id, deliveryTicket);
        return true;
    }
    catch (e) {
        return false;
    }
};

export const updateofflineDataSync = async (id, data) => {
    try {
        var offlineDataSync = await findOne(objectStore.offlineDataSync, id);
        if (offlineDataSync) {
            offlineDataSync?.data?.offlineStatusLog.push({ status: data.status, date: new Date() })
            offlineDataSync.data = { ...offlineDataSync.data, ...data }
            await insertUpdate(objectStore.offlineDataSync, id, offlineDataSync);
        }
        else {
            let fields = await findOne(objectStore.resource, objectStore.deliveryTicket)
            fields = fields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
            const deliveryTicket = await findOne(objectStore.deliveryTicket, id)
            const newData: any = getObjKeysWithValues(deliveryTicket, fields)
            newData.offlineStatusLog = [];
            newData.offlineStatusLog.push({ status: data.status, date: new Date() })
            await insertUpdate(objectStore.offlineDataSync, id, { type: "deliveryTicket", data: { _id: id, ...newData, ...data } });
        }
        return true;
    }
    catch (e) {
        return false;
    }
};