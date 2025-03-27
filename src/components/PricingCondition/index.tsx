import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { autoCalculateSpecificFields } from "src/constants/formulaUtility";
import { pricingCondition, sidebarResource } from "src/constants/helpers";

export const getPricingConditions = (resource: any, referenceData: any, material: any[], conditionType: any) => {
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
    if ([sidebarResource.invoice, sidebarResource.salesOrder]?.includes(resource)) {
      if (referenceData?.creationDate) {
        data.date = referenceData?.creationDate;
      }
    }
    else if (resource === sidebarResource.quotation) {
      if (referenceData?.quotationDate) {
        data.date = referenceData?.quotationDate;
      }
    } else {
      data.date = referenceData?.estimateStartDate;
    }
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

export const getTaxList = async (user: any, referenceData: any, materialType: any, taxApplicableField = 'billingAddress') => {
  let data = []
  let taxApplicableOnCustomer = true;
  if (user?.user?.brandPolicy?.customerWiseTaxApplicable) {
    if (referenceData?.customerAccount?.taxApplicable) {
      taxApplicableOnCustomer = true
    }
    else {
      taxApplicableOnCustomer = false
    }
  }
  if (taxApplicableOnCustomer) {
    const zipCode = referenceData?.[taxApplicableField]?.zipCode;
    const state = referenceData?.[taxApplicableField]?.state;
    const county = referenceData?.[taxApplicableField]?.county;
    let taxCode = null;
    if (referenceData?.taxCode?.optionValue) {
      taxCode = referenceData?.taxCode?.optionValue;
    }
    let api = `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}&materialType=${materialType}`
    if (taxCode) {
      api += `&taxCode=${taxCode}`
    }
    const response = await axiosInstance().get(api);
    data = response?.data?.data || [];
  }
  return data;
};


export const getTaxById = async (taxCode: any) => {
  let data = []
  const response = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${taxCode}`);
  data = response?.data?.data || [];
  return data;
}

