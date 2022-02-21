export const STATUS = ['New', 'In Progress', 'Completed'];
export const TRANSFER_STEPS = ['Add Inventories', 'Completed'];
export const mapPlantOption = (data: any, length: number) => {
  return {
    address: data.address,
    default: false,
    entity: data.entity,
    optionLabel: data.warehouseName,
    optionValue: data._id,
    order: length
  };
};
