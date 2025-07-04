import { camelCase, orderBy } from "lodash";
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
      const obj: any = {
        materialId: ele?.materialId,
        materialType: ele?.type,
        qty: ele?.qty || 1,
        currency: referenceData?.currency
      }
      if (ele?.product) {
        obj.product = ele.product
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

export const getPricingValue = (row: any, priceData: any, currency: any, fields: any[], subStatusFields: any[] = []) => {
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
    if (subStatusFields?.length > 0) {
      subStatusFields?.forEach(sf => {
        const field = fields?.find(f => f?.fieldName === `${camelCase(sf)}Price`)
        if (field) {
          row[`${field?.fieldName}_${currency?.toLowerCase()}`] = rateList[0]?.assetSubStatusPrice?.[`${camelCase(sf)}`] || 0
        }
      });
    }
    const calValues1 = autoCalculateSpecificFields({ pricingMethod: row['pricingMethod'] }, row, fields);
    Object.assign(row, calValues1);
    const calValues2 = autoCalculateSpecificFields({ [priceFieldName]: rateList[0].mrp }, row, fields);
    Object.assign(row, calValues2);
    if (rateList[0]?.durationBasedPricing?.length > 0) {
      let price = 0
      const durationBasedPricing = orderBy(rateList[0]?.durationBasedPricing, ['duration'], ['asc'])
      for (let i = 0; i < durationBasedPricing?.length; i++) {
        if (row?.estimateJobDuration === durationBasedPricing[i].duration) {
          return durationBasedPricing[i].price;
        }
        if (row?.estimateJobDuration < durationBasedPricing[i].duration) {
          return price ? price : 0;
        }
        price = durationBasedPricing[i]?.price;
      }
      if (price) {
        const calValues = autoCalculateSpecificFields({ [priceFieldName]: price }, row, fields);
        Object.assign(row, calValues);
      }
    }
  }
  return row;
};

export const getDurationBasedPrice = (row: any, pricingList: any[]) => {
  let price = 0
  const priceValue = pricingList?.find(d => row?.materialId === d?.materialId && row?.type === d?.materialType && d.conditionId === row['pricingCondition'] && d.pricingMethod === row['pricingMethod'] && d.unit === row['unit'])
  if (priceValue && priceValue?.durationBasedPricing?.length > 0) {
    const durationBasedPricing = orderBy(priceValue?.durationBasedPricing, ['duration'], ['asc'])
    for (let i = 0; i < durationBasedPricing?.length; i++) {
      if (row?.estimateJobDuration === durationBasedPricing[i].duration) {
        return durationBasedPricing[i].price;
      }
      if (row?.estimateJobDuration < durationBasedPricing[i].duration) {
        return price ? price : 0;
      }
      price = durationBasedPricing[i]?.price;
    }
  }

  return price
}

export const getTaxList = async (user: any, referenceData: any, fields: any, materialType: any, taxApplicableField = 'billingAddress') => {
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
    if (fields?.find((e) => e?.fieldData?.fieldName === 'taxCode' || e?.fieldName === 'taxCode')) {
      if (referenceData?.taxCode?.optionValue) {
        let api = `${routes?.taxMaster.path}/by-zipcode?taxCode=${referenceData?.taxCode?.optionValue}&materialType=${materialType}`
        const response = await axiosInstance().get(api);
        data = response?.data?.data || [];
      }
    }
    else {
      const zipCode = referenceData?.[taxApplicableField]?.zipCode;
      const state = referenceData?.[taxApplicableField]?.state;
      const county = referenceData?.[taxApplicableField]?.county;
      let api = `${routes?.taxMaster.path}/by-zipcode?zipCode=${zipCode}&state=${state}&county=${county}&materialType=${materialType}`
      const response = await axiosInstance().get(api);
      data = response?.data?.data || [];
    }
  }
  return data;
};


export const getTaxById = async (taxCode: any) => {
  let data = []
  const response = await axiosInstance().get(`${routes?.taxMaster.path}/by-zipcode?taxCode=${taxCode}`);
  data = response?.data?.data || [];
  return data;
}

