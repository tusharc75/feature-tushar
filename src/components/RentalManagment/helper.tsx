
import { useState, useEffect, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom'
import { CHILD_RESOURCE, pricingCondition } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { objectStore, findOne } from '../../constants/indexdbhelper';
import axiosInstance from '../../axios/axiosInstance';
import { autoCalculateSpecificFields, CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_rental_product_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, 'rentalManagementProduct');
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementProduct}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    const allFields = [...data];
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return { fields: data, allFields: allFields };
}

export const fetch_rental_cost_fields = async (currency, isOffline) => {
    var data;
    if (isOffline) {
        data = await findOne(objectStore.resource, 'rentalManagementCost');
    } else {
        const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.rentalManagementCost}`);
        data = response?.data?.data;
    }
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    var isRateRequired = false
    data.forEach(element => {
        if (element.fieldName === "price" && element.required) {
            isRateRequired = true;
        }
    });
    if (!isRateRequired) {
        data = data.filter((e) => e.sectionName !== "Pricing Information")
    }
    return data;
}

export const calculatePrice = (rentalManagementData: any = null, arr: any[]) => {
    //materialType can be =["product","packages","productCategory"]
    //conditionType can be =["Price","Rent","Discount","Charge","Tax"]
    if (rentalManagementData) {
        const data: any = {};
        data.conditionType = ['Rent'];
        data.material = arr.map((ele) => ({
            materialId: ele?.materialId,
            materialType: ele?.type,
            qty: ele?.qty,
            pricingMethod: ele?.pricingMethod,
            unit: [ele?.unit].flat(1).pop(),
            currency: rentalManagementData?.currency
        }));
        data.supplier = [];
        data.customer = [rentalManagementData?.customerAccount?.optionValue];
        data.warehouse = [rentalManagementData?.warehouse?.optionValue];
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

export const sumOnParent = (parent, child, fields) => {
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
                row[ele.fieldName] = parseFloat((sumValues[ele.fieldName] / parent.length).toFixed(2));
            }
        })
    })

    return parent;
}

export const resetValueZero = (material, fields, _id) => {
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
    material?.filter((e) => e.parentId === _id)?.forEach((child) => {
        resetFields.forEach((fieldName) => {
            child[fieldName] = 0;
        })
        result.push(child)
        material?.filter((e) => e?.parentId === child?._id)?.forEach((subChild) => {
            resetFields.forEach((fieldName) => {
                subChild[fieldName] = 0;
            })
            result.push(subChild)
        })
    })
    return result;
}

const calculateParentRows = (material: any[], rows: any, fields: any[], rowData: any, parent) => {
    let tempParent: any = material.filter((e) => e._id === rowData.parentId)
    const sameParent: any = material.filter((e) => e.parentId === rowData.parentId && e._id !== rowData._id)
    tempParent = sumOnParent(tempParent, [...sameParent, ...rows], fields)
    parent.push(tempParent[0])
    if (tempParent[0].parentId) {
        calculateParentRows(material, tempParent, fields, tempParent[0], parent)
    }
};

export const calculateRowsField = async (material: any[], values: any, fields: any[], rowData: any) => {
    let rows: any = []
    const calValues = autoCalculateSpecificFields(values, { ...values, ...rowData }, fields)
    rows.push({ ...rowData, ...calValues })
    if (rowData.parentId) {
        let parent: any = []
        await calculateParentRows(material, rows, fields, rowData, parent)
        rows = [...rows, ...parent]
    }
    const child = resetValueZero(material, fields, rowData._id)
    return [...rows, ...child];
};                                 