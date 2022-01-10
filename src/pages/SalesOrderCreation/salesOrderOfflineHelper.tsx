
import { objectStore, insertUpdate, findOne, findAll } from '../../constants/indexdbhelper';

export const getSalesOrderProductAssets = async (id) => {
    const salesOrder = await findOne(objectStore.salesOrder, id);
    return salesOrder?.productInventory?.map(u => ({ ...u.inventoryDetail }))
};

export const getSalesOrderDeliveryTicket = async (id) => {
    try {
        const deliveryTicket = await findAll(objectStore.deliveryTicket);
        const result: any = []
        deliveryTicket.forEach(e => {
            if (e?.salesOrderNo?.optionValue === id) {
                result.push(e)
            }
        })
        return result
    }
    catch (e) {
        console.log(e)
    }
};

export const updateSalesOrderAssetStatus = async (id, status) => {
    try {
        const salesOrder = await findOne(objectStore.salesOrder, id);
        salesOrder?.productInventory?.forEach(element => {
            if (element?.inventoryDetail) {
                element.inventoryDetail.status = status;
            }
        });
        await insertUpdate(objectStore.salesOrder, id, salesOrder);
        return true;
    }
    catch (e) {
        console.log(e)
        return false;
    }
}
