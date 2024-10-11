
import { CHILD_RESOURCE, PRICING_SETUP_TYPE, getObjKeysWithValues, pricingCondition } from '../../constants/helpers';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from '../../constants/formulaUtility';
import { unionBy, uniq, map, isArray, isObject } from 'lodash';

export const fetch_rental_product_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, CHILD_RESOURCE.rentalManagementProduct);
    } else {
        const response = await axiosInstance().get(`/field?resource=${CHILD_RESOURCE.rentalManagementProduct}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data?.map(d => ({ ...d?.fieldData, isRead: d?.isRead })), currency ? currency : "USD");
    return data;
}

export const fetch_rental_cost_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, CHILD_RESOURCE.rentalManagementCost);
    } else {
        // const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`);
        const response = await axiosInstance().get(`/field?resource=${CHILD_RESOURCE.rentalManagementCost}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data?.map(d => ({ ...d?.fieldData, isRead: d?.isRead })), currency ? currency : "USD");
    return data;
}

export const fetch_rental_technician_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, CHILD_RESOURCE.rentalManagementTechnician);
    } else {
        const response = await axiosInstance().get(`/field?resource=${CHILD_RESOURCE.rentalManagementTechnician}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data?.map(d => ({ ...d?.fieldData, isRead: d?.isRead })), currency ? currency : "USD");
    return data;
}

export const fetch_rental_quotation_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, CHILD_RESOURCE.quotationProduct);
    } else {
        const response = await axiosInstance().get(`/field?resource=${CHILD_RESOURCE.quotationProduct}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data?.map(d => ({ ...d?.fieldData, isRead: d?.isRead })), currency ? currency : "USD");
    return data;
}

export const calculatePrice = (rentalManagementData: any = null, arr: any[]) => {
    if (rentalManagementData) {
        const data: any = {};
        data.conditionType = [PRICING_SETUP_TYPE.rent];
        const material: any = []
        arr?.forEach((ele) => {
            const obj = {
                materialId: ele?.materialId,
                materialType: ele?.type,
                qty: ele?.qty,
                pricingMethod: ele?.pricingMethod,
                currency: rentalManagementData?.currency
            }
            if (isArray(ele?.unit)) {
                ele?.unit?.forEach((e) => {
                    material.push({ ...obj, unit: e })
                })
            }
            else {
                material.push({ ...obj, unit: ele?.unit })
            }
        })
        data.material = material;
        data.supplier = [];
        data.customer = [rentalManagementData?.customerAccount?.optionValue];
        data.warehouse = [rentalManagementData?.warehouse?.optionValue];
        data.address = rentalManagementData?.shippingAddress?.optionValue ? [rentalManagementData?.shippingAddress?.optionValue] : [];
        return new Promise((resolve, reject) => {
            axiosInstance()
                .post(pricingCondition.api + `/calculatePrice`, data)
                .then(({ data: { data } }) => {
                    resolve(data);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }
};

export const sumOnParent = (parent, child, fields, currency) => {
    const resetFields = []
    fields.forEach((element) => {
        if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
            if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                element.displayUnits.forEach((_unit) => {
                    resetFields.push({ fieldName: element.fieldName + "_" + _unit.toLowerCase(), type: "amount" })
                })
            }
            else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                element.displayUnits.forEach((_unit) => {
                    element.displayCurrency.forEach((_currency) => {
                        resetFields.push({ fieldName: element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase(), type: "amount" })
                    })
                })
            }
            else if (element.type === "currencyAmount") {
                element.displayCurrency.forEach((_currency) => {
                    resetFields.push({ fieldName: element.fieldName + "_" + _currency.toLowerCase(), type: "amount" })
                })
            }
        }
        else if (element.type === "percent") {
            resetFields.push({ fieldName: element.fieldName, type: "percent" })
        }
    })
    const sumValues: any = {}
    resetFields.forEach((_field: any) => {
        sumValues[_field.fieldName] = 0;
        child.forEach(element => {
            sumValues[_field.fieldName] += element[_field.fieldName] ? element[_field.fieldName] : 0;
        });
    });
    parent.forEach((row) => {
        resetFields.forEach((ele) => {
            if (ele.type === "amount") {
                row[ele.fieldName] = sumValues[ele.fieldName];
            }
            else {
                if (ele.fieldName === "discountPercentage") {
                    row[ele.fieldName] = parseFloat(((sumValues[`discount_${currency?.toLowerCase()}`] / sumValues[`totalPrice_${currency?.toLowerCase()}`]) * 100)?.toFixed(2));
                }
                if (ele.fieldName === "taxPercentage") {
                    row[ele.fieldName] = parseFloat(((sumValues[`tax_${currency?.toLowerCase()}`] / (sumValues[`totalPrice_${currency?.toLowerCase()}`] - sumValues[`discount_${currency?.toLowerCase()}`])) * 100)?.toFixed(2));
                }
            }
        })
    })
    return parent;
}

export const resetValueZero = (material, fields, parentId, bulkUpdateValues = null) => {
    const resetFields = []
    const updateFields = []

    fields.forEach((element) => {
        if (element.type === "converter" || element.type === "currencyAmount" || element.isConverter === true) {
            if (element.type !== "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                element.displayUnits.forEach((_unit) => {
                    resetFields.push(element.fieldName + "_" + _unit.toLowerCase())
                })
            }
            else if (element.type === "currencyAmount" && (element.type === "converter" || element.isConverter === true)) {
                element.displayUnits.forEach((_unit) => {
                    element.displayCurrency.forEach((_currency) => {
                        resetFields.push(element.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase())
                    })
                })
            }
            else if (element.type === "currencyAmount") {
                element.displayCurrency.forEach((_currency) => {
                    resetFields.push(element.fieldName + "_" + _currency.toLowerCase())
                })
            }
        }
        else if (element.type === "percent") {
            resetFields.push(element.fieldName)
        }
        else if (bulkUpdateValues && bulkUpdateValues[element.fieldName]) {
            updateFields.push(element.fieldName)
        }
    })
    const result = [];
    material?.filter((e) => e.parentId === parentId)?.forEach((child) => {
        resetFields.forEach((fieldName) => {
            child[fieldName] = 0;
        })
        if (bulkUpdateValues && updateFields?.length) {
            updateFields.forEach((fieldName) => {
                child[fieldName] = bulkUpdateValues[fieldName];
            })
        }
        result.push(child)
        material?.filter((e) => e?.parentId === child?._id)?.forEach((subChild) => {
            resetFields.forEach((fieldName) => {
                subChild[fieldName] = 0;
            })
            if (bulkUpdateValues && updateFields?.length) {
                updateFields.forEach((fieldName) => {
                    subChild[fieldName] = bulkUpdateValues[fieldName];
                })
            }
            result.push(subChild)
        })
    })
    return result;
}

const calculateParentRows = (material: any[], rows: any, fields: any[], rowData: any, parent: any, currency: any) => {
    let tempParent: any = material.filter((e) => e._id === rowData.parentId)
    const sameParent: any = material.filter((e) => e.parentId === rowData.parentId && e._id !== rowData._id)
    tempParent = sumOnParent(tempParent, [...sameParent, ...rows], fields, currency)
    parent.push(tempParent[0])
    if (tempParent[0].parentId) {
        calculateParentRows(material, tempParent, fields, tempParent[0], parent, currency)
    }
};

export const calculateRowsField = async (material: any[], values: any, fields: any[], rowData: any, currency: any, resetChild: any = true) => {
    currency = (currency || 'USD')?.toLowerCase()
    let rows: any = []
    let childs: any = []

    const calValues = autoCalculateSpecificFields(values, { ...values, ...rowData }, fields)
    rows.push({ ...rowData, ...calValues })

    if (values[`finalPrice_${currency}`] !== rowData[`finalPrice_${currency}`]) {
        if (rowData.parentId) {
            let parent: any = []
            await calculateParentRows(material, rows, fields, rowData, parent, currency)
            rows = [...rows, ...parent]
        }
        if (resetChild) {
            childs = resetValueZero(material, fields, rowData._id)
        }
    }
    const result: any = [];
    [...rows, ...childs]?.forEach((e: any) => {
        result.push({ _id: e._id, ...getObjKeysWithValues(e, fields) })
    })
    return result;
};

export const getNestedSubRows = (obj, original) => {
    if (original?.subRows?.length) {
        original?.subRows.forEach((element) => {
            obj.push({ id: element._id, type: element.type, materialId: element.materialId });
            getNestedSubRows(obj, element);
        });
    }
};

export const bulkUpdate = (values, selectedProducts, material, allFields, currency) => {

    var rows: any = []

    for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
            delete values[x];
        }
    }

    selectedProducts.filter(d => !selectedProducts.some(obj => obj._id === d.parentId)).forEach(element => {

        const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
        rows.push({ ...element, ...calValues })

        const child: any = resetValueZero(material, allFields, element?._id, calValues)
        rows = [...rows, ...child]
        if (element.parentId) {
            var parent: any = unionBy(rows, material, '_id').filter((e: any) => e._id === element.parentId)
            const sameParent: any = unionBy(rows, material, '_id').filter((e: any) => e.parentId === element.parentId && e._id !== element._id)
            parent = sumOnParent(parent, [...sameParent, { ...element, ...calValues }], allFields, currency)
            rows = [...rows, ...parent]
        }
    });

    let packageProducts = selectedProducts.filter((ele) => ele.parentId !== null && !selectedProducts.some(f => f._id === ele.parentId));
    if (packageProducts.length) {
        const packageIds = uniq(map(packageProducts, 'parentId'))
        packageIds.forEach((_packageId) => {
            var packages: any = material.filter((e) => e._id === _packageId)
            const product: any = material.filter((e) => e.parentId === _packageId)
            product.forEach((element) => {
                if (packageProducts.filter((e) => element._id === e._id).length) {
                    const calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
                    rows.push({ ...element, ...calValues })
                    for (var key in calValues) {
                        element[key] = calValues[key];
                    }
                }
            })
            packages = sumOnParent(packages, product, allFields, currency)
            rows = [...rows, ...packages]
        })
    }

    let updatedRows: any = [];
    rows = rows?.forEach((e: any) => {
        updatedRows.push({ _id: e._id, ...getObjKeysWithValues(e, allFields) });
    })
    return updatedRows;
};

export const getParentWellNumber = (material, _id) => {
    const materialData = material?.find((e) => e._id === _id);
    const parent = material?.find((e) => e._id === materialData?.parentId);
    if (parent) {
        return getParentWellNumber(material, parent._id)
    }
    else {
        return materialData?.wellNumber
    }
}


export const getUniqueWellNumber = (data) => {
    const wellNumber: any = [];
    data?.forEach((ele) => {
        if (ele?.wellNumber) {
            if (ele?.wellNumber?.optionValue) {
                wellNumber.push(ele?.wellNumber?.optionValue);
            }
            else if (isArray(ele?.wellNumber)) {
                ele?.wellNumber?.forEach((e) => {
                    wellNumber.push(e?.optionValue);
                })
            }
        }
    })
    return uniq(wellNumber);
}

