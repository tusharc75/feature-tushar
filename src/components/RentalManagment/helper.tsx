
import { CHILD_RESOURCE, PRICING_SETUP_TYPE, getObjKeysWithValues, pricingCondition } from '../../constants/helpers';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from '../../constants/formulaUtility';
import { unionBy, uniq, map, isArray, isObject } from 'lodash';
import dayjs from 'dayjs';

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
        else if (element.type === "date") {
            resetFields.push({ fieldName: element.fieldName, type: "date" })
        }
    })
    const sumValues: any = {}
    const minMaxDates: any = {}


    const totalPriceFieldName = `totalPrice_${currency?.toLowerCase()}`
    const discountFieldName = `discount_${currency?.toLowerCase()}`
    const taxFieldName = `tax_${currency?.toLowerCase()}`

    resetFields.forEach((_field: any) => {
        sumValues[_field.fieldName] = 0;
        minMaxDates[_field.fieldName] = null;
        child.forEach(element => {
            if (_field.type === 'date') {
                if (_field.fieldName?.includes("startDate")) {
                    if (element?.[_field.fieldName] && (!minMaxDates[_field.fieldName] || new Date(element?.[_field.fieldName]) < minMaxDates[_field.fieldName])) {
                        minMaxDates[_field.fieldName] = new Date(element?.[_field.fieldName]);
                    }
                }
                else {
                    if (element?.[_field.fieldName] && (!minMaxDates[_field.fieldName] || new Date(element?.[_field.fieldName]) > minMaxDates[_field.fieldName])) {
                        minMaxDates[_field.fieldName] = new Date(element?.[_field.fieldName]);
                    }
                }
            }
            else {
                sumValues[_field.fieldName] += element[_field.fieldName] ? element[_field.fieldName] : 0;
            }
        });
    });
    parent.forEach((row) => {
        resetFields.forEach((ele) => {
            if (ele.type === "amount") {
                if (sumValues[ele.fieldName]) {
                    row[ele.fieldName] = sumValues[ele.fieldName];
                }
            }
            else if (ele.fieldName === "discountPercentage") {
                let value = parseFloat(((sumValues[`discount_${currency?.toLowerCase()}`] / sumValues[`totalPrice_${currency?.toLowerCase()}`]) * 100)?.toFixed(2));;
                if (value) {
                    row[ele.fieldName] = value;
                }
            }
            else if (ele.fieldName === "taxPercentage") {
                let value = parseFloat(((sumValues[`tax_${currency?.toLowerCase()}`] / (sumValues[`totalPrice_${currency?.toLowerCase()}`] - sumValues[`discount_${currency?.toLowerCase()}`])) * 100)?.toFixed(2));
                if (value) {
                    row[ele.fieldName] = value;
                }
            }
            else if (ele.type === 'percent') {
                let value = parseFloat((sumValues[ele.fieldName] / child?.length)?.toFixed(2));
                if (value) {
                    row[ele.fieldName] = value;
                }
            }
            else if (ele.type === 'date') {
                if (minMaxDates[ele.fieldName]) {
                    row[ele.fieldName] = dayjs(minMaxDates[ele.fieldName]);
                }
            }
        })

        const originalRow = { ...row }

        const calValues = autoCalculateSpecificFields({ [totalPriceFieldName]: row[totalPriceFieldName] * row?.qty }, row, fields)
        Object.assign(row, calValues)

        if (originalRow[discountFieldName]) {
            const calValues = autoCalculateSpecificFields({ [discountFieldName]: originalRow[discountFieldName] * row?.qty }, row, fields)
            Object.assign(row, calValues)
        }

        if (originalRow[taxFieldName]) {
            const calValues = autoCalculateSpecificFields({ [taxFieldName]: originalRow[taxFieldName] * row?.qty }, row, fields)
            Object.assign(row, calValues)
        }
    })

    return parent;
}

export const resetValueZero = (material, fields, parentId) => {
    const resetFields = []
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
    })
    const result = [];
    material?.filter((e) => e.parentId === parentId)?.forEach((child) => {
        resetFields.forEach((fieldName) => {
            child[fieldName] = 0;
        })
        result.push(child)
        material?.filter((e) => e?.parentId === child?._id)?.forEach((subChild) => {
            resetFields.forEach((fieldName) => {
                child[fieldName] = 0;
            })
            result.push(subChild)
        })
    })
    return result;
}

export const resetObjectValueZero = (fields, row) => {
    const resetFields = []
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
    })
    resetFields.forEach((fieldName) => {
        row[fieldName] = 0;
    })
    return row;
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

export const calculateRowsField = async (material: any[], values: any, fields: any[], rowData: any, currency: any) => {
    currency = (currency || 'USD')?.toLowerCase()
    let rows: any = []
    let childs: any = []

    const calValues = autoCalculateSpecificFields(values, { ...values, ...rowData }, fields)
    const newRowData = { ...rowData, ...calValues }

    if (rowData.parentId) {
        rows.push(newRowData)
        if (newRowData[`finalPrice_${currency}`] !== rowData[`finalPrice_${currency}`]) {
            let parent: any = []
            await calculateParentRows(material, rows, fields, rowData, parent, currency)
            rows = [...rows, ...parent]
        }
    } else {
        const parents = material.filter((e) => e.parentId === rowData._id);
        if (parents?.length) {
            if (newRowData[`finalPrice_${currency}`] !== rowData[`finalPrice_${currency}`]) {
                if (parents?.find((e) => e[`finalPrice_${currency}`]) && newRowData[`qty`] !== rowData[`qty`] && newRowData[`price_${currency}`] === rowData[`price_${currency}`]) {
                    const tempParent = sumOnParent([newRowData], parents, fields, currency)
                    rows.push(tempParent[0])
                }
                else {
                    rows.push(newRowData)
                    childs = resetValueZero(material, fields, rowData._id)
                }
            }
        } else {
            rows.push(newRowData);
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

export const bulkUpdate = (values, selectedProducts, material, allFields, currency, priorityToParent = false, childMatrialUpdate: any = []) => {

    var rows: any = []

    for (const x in values) {
        if (values[x] === '' || values[x] === 0 || (Array.isArray(values[x]) && values[x].length === 0)) {
            delete values[x];
        }
    }

    let parentIds = []

    selectedProducts.forEach((element: any) => {
        let calValues = autoCalculateSpecificFields(values, { ...element, ...values }, allFields)
        if (childMatrialUpdate?.length && !childMatrialUpdate?.includes(element.type)) {
            calValues = resetObjectValueZero(allFields, calValues)
        }
        if (element?.parentId) {
            rows.push({ ...element, ...calValues })
            parentIds.push(element?.parentId)
        } else if (!material?.find((e) => e.parentId === element._id)) {
            rows.push({ ...element, ...calValues })
        }
    })

    parentIds = uniq(parentIds)

    if (parentIds.length) {
        parentIds.forEach((parentId) => {
            let parent: any = material.find((e) => e._id === parentId)
            if (parent) {
                const child = material.filter((e) => e.parentId === parentId);
                child?.forEach((ele) => {
                    if (rows?.find((e) => e?._id === ele?._id)) {
                        Object.assign(ele, rows?.find((e) => e?._id === ele?._id))
                    }
                })
                if (selectedProducts?.find((e) => e._id === parent._id)) {
                    const calValues = autoCalculateSpecificFields(values, { ...parent, ...values }, allFields)
                    Object.assign(parent, calValues)
                }
                if (priorityToParent) {
                    rows.push(parent)
                    const resetChilds = resetValueZero(child, allFields, parent._id)
                    rows?.forEach((ele) => {
                        if (resetChilds?.find((e) => e?._id === ele?._id)) {
                            Object.assign(ele, resetChilds?.find((e) => e?._id === ele?._id))
                        }
                    })
                }
                else {
                    const tempParent = sumOnParent([parent], child, allFields, currency)
                    Object.assign(parent, tempParent[0])
                    rows.push(parent)
                }
            }
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

