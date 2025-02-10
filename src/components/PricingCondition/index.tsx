import axiosInstance from "src/axios/axiosInstance";
import { autoCalculateSpecificFields } from "src/constants/formulaUtility";
import { pricingCondition } from "src/constants/helpers";

export const getPricingConditions = (referenceData: any, material: any[], conditionType: any) => {
  if (referenceData) {
    const data: any = {};
    data.conditionType = [conditionType];
    const rows: any = []
    material?.forEach((ele) => {
      const obj = {
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty || 1,
        currency: referenceData?.currency
      }
      rows.push(obj)
    })
    data.material = rows;
    data.supplier = referenceData?.supplierAccount?.optionValue ? [referenceData?.supplierAccount?.optionValue] : [];
    data.customer = referenceData?.customerAccount?.optionValue ? [referenceData?.customerAccount?.optionValue] : [];
    data.warehouse = referenceData?.warehouse?.optionValue ? [referenceData?.warehouse?.optionValue] : [];
    data.address = referenceData?.shippingAddress?.optionValue ? [referenceData?.shippingAddress?.optionValue] : [];
    return new Promise((resolve, reject) => {
      axiosInstance()
        .post(pricingCondition.api + `/material-pricing-data`, data)
        .then(({ data: { data } }) => {
          let pricingData = data;
          if (referenceData?.pricingCondition?.optionValue) {
            pricingData = data?.filter((e) => e.conditionId === referenceData?.pricingCondition?.optionValue);
          }
          resolve(pricingData);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
};


export const getPricingValue = (row: any, priceData: any, currency: any, fields: any[]) => {
  let rateList = [];
  let changeUnit = false;
  rateList = priceData?.filter((e) => e.materialId === row.materialId && e.materialType === row.type && e.unit === row.unit);
  if (!rateList?.length) {
    rateList = priceData?.filter((e) => e.materialId === row.materialId && e.materialType === row.type);
    changeUnit = true;
  }
  if (rateList.length && rateList[0].mrp) {
    const priceFieldName = `price_${currency?.toLowerCase()}`;
    if (changeUnit) {
      row['unit'] = rateList[0].unit?.trim();
    }
    row[priceFieldName] = rateList[0].mrp;
    row['pricingCondition'] = rateList[0].conditionId;
    row['pricingMethod'] = rateList[0].pricingMethod?.trim();
    const calValues1 = autoCalculateSpecificFields({ pricingMethod: row['pricingMethod'] }, row, fields);
    Object.assign(row, calValues1);
    const calValues2 = autoCalculateSpecificFields({ [priceFieldName]: rateList[0].mrp }, row, fields);
    Object.assign(row, calValues2);
  }
  return row;
};

