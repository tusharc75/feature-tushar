import { uniq } from "lodash";
import { camelCase } from "../constants/helpers";

const removeBracket = (string) => {
    return string.replace(/{/g, '').replace(/}/g, '')
}

const matchField = (string) => {
    return Array.from(string.matchAll(/{([^}]+)}/g), x => x[1])
}

const matchIf = (string) => {
    return Array.from(string.matchAll(/\IF(.*?\))/g), x => x[1])
}

let loop_count = 0;

export const checkFormula = (formula, inputFields) => {
    if (formula === "") {
        return false
    }
    let isValid = true
    const replaceFieldName = []
    try {
        let argument = [];
        let values = [];
        for (var x in inputFields) {
            if (x.includes("/")) {
                argument.push(x.replace("/", ""))
                replaceFieldName.push({ old: x, new: x.replace("/", "") })
            }
            else {
                argument.push(x)
            }
            values.push(inputFields[x])
        }
        var fs: any = [];
        replaceFieldName.forEach((_f: any) => {
            var old = new RegExp(_f.old, "g");
            formula = formula.replace(old, _f.new);
        })
        fs['f1'] = new Function(...argument, formula);
        let result = fs['f1'].apply(null, values);

        if (result === undefined) {
            isValid = false
        }
    }
    catch (e) {
        isValid = false
    }
    return isValid
}

export const getFormulaValue = (formula, inputFields, returnType, decimalPlaces) => {
    let value = 0
    try {
        let argument = [];
        let values = [];
        const replaceFieldName = []
        for (var x in inputFields) {
            if (x.includes("/")) {
                argument.push(x.replace("/", ""))
                replaceFieldName.push({ old: x, new: x.replace("/", "") })
            }
            else {
                argument.push(x)
            }
            values.push(inputFields[x])
        }
        var fs: any = [];
        replaceFieldName.forEach((_f: any) => {
            var old = new RegExp(_f.old, "g");
            formula = formula.replace(old, _f.new);
        })
        fs['f1'] = new Function(...argument, formula);
        value = fs['f1'].apply(null, values);
        if (returnType === "decimal") {
            if (isNaN(value)) {
                value = 0
            }
            //value = parseFloat(value.toFixed(decimalPlaces))
        }
    }
    catch (e) {
    }
    return value
}

const formatDecimal = (value, decimalPlaces) => {
    if (value === "") {
        return 0;
    }
    //&& isNaN(value)
    // else if (parseFloat(value) < 0) {
    //     return 0;
    // }
    else {
        return value
        //return parseFloat(value.toFixed(decimalPlaces));
    }
};

export const handleAutoCalculation = (fieldData, fields, values, name, currency, unit, value) => {
    let resultValues: any = {}
    resultValues[name] = value;
    try {
        loop_count = 0;
        if (fieldData.type !== 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
            resultValues = handleConverter(fieldData, fields, values, fieldData.fieldName, unit, value, resultValues);

        } else if (fieldData.type === 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
            resultValues = handleCurrencyConverter(fieldData, fields, values, fieldData.fieldName, currency, unit, value, resultValues);
        }
        else if (fieldData.type === 'currencyAmount') {
            resultValues = handleCurrency(fieldData, fields, values, fieldData.fieldName, currency, value, resultValues);
        }
        if (fieldData && fieldData.isMulitFormula) {
            resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
        }
        if (fieldData.type === "vlookupDropdown" || fieldData.isVlookup) {
            resultValues = handleVlookup(fieldData, fields, values, name, value, resultValues);
        }
        resultValues = handleFormula(fieldData, fields, values, name, value, resultValues, true);
        resultValues = handleCheckVlookupReverse(fieldData, fields, values, name, value, resultValues);
        if (fieldData.type === 'dropDown' || fieldData.type === 'multiSelect') {
            fields && fields.filter((_f: any) => (_f.type === "dropDown" || _f.type === 'multiSelect') && _f.isDependentDropdown && _f.dropdowDependentOn === fieldData.fieldName).forEach((_r: any) => {
                if (fieldData.type === 'dropDown') {
                    resultValues[_r.fieldName] = ""
                }
                else {
                    resultValues[_r.fieldName] = []
                }
            });
        }
        for (var x in resultValues) {
            if (typeof resultValues[x] === "number") {
                if (isNaN(resultValues[x])) {
                    resultValues[x] = 0
                }
                var decimalPlaces = 2
                var fieldResult = fields.filter((_f: any) => (_f.fieldName === x || _f.fieldName === x.split("_")[0]))
                if (fieldResult.length) {
                    if (fieldResult[0].decimalPlaces || fieldResult[0].decimalPlaces === 0) {
                        decimalPlaces = fieldResult[0].decimalPlaces;
                    }
                }
                resultValues[x] = parseFloat(resultValues[x].toFixed(decimalPlaces))
            }
        }
        resultValues[name] = value;
    }
    catch (e) {
    }
    return resultValues
}

const handleMulitFormula = (fieldData, fields, values, resultValues) => {
    fieldData.formulaFields.forEach((_field: any) => {
        if (resultValues[_field] === undefined) {
            let formulainputFields: any = {};
            fieldData.formulainputFields.forEach((_input: any) => {
                formulainputFields[_input] = resultValues[_input] || resultValues[_input] === 0 ? resultValues[_input] : values[_input] ? values[_input] : 0;
            });
            let calValue = getFormulaValue(fieldData.formulaoption[_field], formulainputFields, "decimal", fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
            resultValues[_field] = calValue;
            let _field_result = fields.filter((_f: any) => _f.fieldName === _field.split("_")[0])
            if (_field_result.length) {
                if (_field_result[0].type !== 'currencyAmount' && (_field_result[0].type === 'converter' || _field_result[0].isConverter === true)) {
                    resultValues = handleConverter(_field_result[0], fields, values, _field_result[0].fieldName, _field.split("_")[1], calValue, resultValues);

                } else if (_field_result[0].type === 'currencyAmount' && (_field_result[0].type === 'converter' || _field_result[0].isConverter === true)) {
                    resultValues = handleCurrencyConverter(_field_result[0], fields, values, _field_result[0].fieldName, _field.split("_")[1].toUpperCase(), _field.split("_")[2], calValue, resultValues);
                }
                else if (_field_result[0].type === 'currencyAmount') {
                    resultValues = handleCurrency(_field_result[0], fields, values, _field_result[0].fieldName, _field.split("_")[1].toUpperCase(), calValue, resultValues);
                }
                if (_field_result[0].isMulitFormula) {
                    resultValues = handleMulitFormula(_field_result[0], fields, values, resultValues);
                }
                resultValues = handleFormula(_field_result[0], fields, values, _field, calValue, resultValues, false);
            }
        }
    });
    return resultValues
};

const handleFormula = (fieldData, fields, values, name, value, resultValues, isOverride) => {
    if (fields && fields.filter((_f) => (_f.type === "formula" || _f.isFormula === true) && _f.inputFields.includes(name)).length) {
        fields.filter((_f) => (_f.type === "formula" || _f.isFormula === true) && _f.inputFields.includes(name)).forEach((_data) => {
            if (_data.inputFields.includes(name)) {
                loop_count++
                if (loop_count > 100) {
                    console.warn("Loop in formula")
                    return resultValues
                }
                let inputFields = {};
                _data.inputFields.forEach((_input) => {
                    if (name === _input) {
                        inputFields[_input] = value;
                    } else {
                        inputFields[_input] = (resultValues[_input] || resultValues[_input] === 0) ? resultValues[_input] : values[_input] ? values[_input] : 0;
                    }
                });
                let calValue = getFormulaValue(_data.formula, inputFields, _data.returnType, _data.decimalPlaces);
                calValue = formatDecimal(calValue, _data.decimalPlaces ? _data.decimalPlaces : 2);
                let _fieldName = _data.fieldName;
                if (_data.type === "currencyAmount" || _data.type === "converter" || _data.isConverter) {
                    if (_data.type !== 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                        _fieldName = _fieldName + "_" + (_data.formulaOnConverter && _data.formulaOnConverter !== "" ? _data.formulaOnConverter.toLowerCase() : _data.displayUnits[0].toLowerCase())
                    }
                    else if (_data.type === 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                        _fieldName = _fieldName + "_" + (_data.formulaOnCurrency && _data.formulaOnCurrency !== "" ? _data.formulaOnCurrency.toLowerCase() : _data.displayCurrency[0].toLowerCase())
                            + "_" + (_data.formulaOnConverter && _data.formulaOnConverter !== "" ? _data.formulaOnConverter.toLowerCase() : _data.displayUnits[0].toLowerCase())
                    }
                    else if (_data.type === 'currencyAmount') {
                        _fieldName = _fieldName + "_" + (_data.formulaOnCurrency && _data.formulaOnCurrency !== "" ? _data.formulaOnCurrency.toLowerCase() : _data.displayCurrency[0].toLowerCase())
                    }
                    if (resultValues[_fieldName] === undefined || isOverride) {
                        resultValues[_fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues, true);
                        resultValues = handleCheckVlookupReverse(fieldData, fields, values, _fieldName, calValue, resultValues);
                        if (_data.type !== 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            if (_data.displayUnits && _data.displayUnits.length) {
                                resultValues = handleConverter(
                                    _data,
                                    fields,
                                    values,
                                    _data.fieldName,
                                    _data.formulaOnConverter && _data.formulaOnConverter !== "" ? _data.formulaOnConverter : _data.displayUnits[0],
                                    calValue,
                                    resultValues
                                );
                            }
                        }
                        else if (_data.type === 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            if (_data.displayCurrency && _data.displayCurrency.length && _data.displayUnits && _data.displayUnits.length) {
                                resultValues = handleCurrencyConverter(
                                    _data,
                                    fields,
                                    values,
                                    _data.fieldName,
                                    _data.formulaOnCurrency && _data.formulaOnCurrency !== "" ? _data.formulaOnCurrency : _data.displayCurrency[0],
                                    _data.formulaOnConverter && _data.formulaOnConverter !== "" ? _data.formulaOnConverter : _data.displayUnits[0],
                                    calValue,
                                    resultValues
                                )
                            }
                        }
                        else if (_data.type === 'currencyAmount') {
                            if (_data.displayCurrency && _data.displayCurrency.length) {
                                resultValues = handleCurrency(
                                    _data,
                                    fields,
                                    values,
                                    _data.fieldName,
                                    _data.formulaOnCurrency && _data.formulaOnCurrency !== "" ? _data.formulaOnCurrency : _data.displayCurrency[0],
                                    calValue,
                                    resultValues
                                );
                            }
                        }
                        if (_data.isMulitFormula && isOverride) {
                            resultValues = handleMulitFormula(_data, fields, values, resultValues);
                        }
                    }
                    // else {
                    //     resultValues[_fieldName] = calValue;
                    // }
                } else {
                    if (resultValues[_fieldName] === undefined || isOverride) {
                        resultValues[_fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues, true);
                        resultValues = handleCheckVlookupReverse(fieldData, fields, values, _fieldName, calValue, resultValues);
                        if (_data.isMulitFormula && isOverride) {
                            resultValues = handleMulitFormula(_data, fields, values, resultValues);
                        }
                    }
                    // else {
                    //     resultValues[_fieldName] = calValue;
                    // }
                }
            }
        });
    }
    return resultValues;
};

const handleVlookup = (fieldData, fields, values, name, value, resultValues) => {
    if (fieldData.option && fieldData.option.length) {
        let result = fieldData.option.filter((data) => data.optionValue === value);
        if (result.length) {
            for (var x in result[0]) {
                if (x !== "optionLabel" && x !== "optionValue") {
                    resultValues[x] = result[0][x];
                    resultValues = handleFormula(fieldData, fields, values, x, result[0][x], resultValues, true)
                }
            }
        }
    }
    return resultValues;
};

const handleCheckVlookupReverse = (fieldData, fields, values, name, value, resultValues) => {
    if (fields && fields.filter((_f: any) => (_f.type === "vlookupDropdown" || _f.isVlookup) && !_f.isvlookupReverse).length) {
        fields.filter((_f: any) => (_f.type === "vlookupDropdown" || _f.isVlookup) && !_f.isvlookupReverse).forEach((_data: any) => {
            if (_data.vlookupInputFields.includes(name)) {
                let result = _data.option && _data.option.filter(function (val: any) {
                    for (var i = 0; i < _data.vlookupInputFields.length; i++)
                        if ((_data.vlookupInputFields[i] === name ? value : (values[_data.vlookupInputFields[i]])) != (val[_data.vlookupInputFields[i]]))
                            return false;
                    return true;
                });

                if (result.length) {
                    if (_data.type === "currencyAmount" || _data.type === "converter" || _data.isConverter) {
                        if (_data.type !== 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            const _unit = _data.vlookupOnConverter ? _data.vlookupOnConverter : _data.displayUnits[0];
                            resultValues[_data.fieldName + "_" + _unit.toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleConverter(_data, fields, values, _data.fieldName, _unit, result[0].optionLabel, resultValues)
                            resultValues = handleFormula(_data, fields, values, _data.fieldName + "_" + _unit.toLowerCase(), result[0].optionLabel, resultValues, true)
                        }
                        else if (_data.type === 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            const _unit = _data.vlookupOnConverter ? _data.vlookupOnConverter : _data.displayUnits[0];
                            resultValues[_data.fieldName + "_" + _data.displayCurrency[0].toLowerCase() + "_" + _unit.toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleCurrencyConverter(_data, fields, values, _data.fieldName, _data.displayCurrency[0], _unit, result[0].optionLabel, resultValues)
                            resultValues = handleFormula(_data, fields, values, _data.fieldName + "_" + _data.displayCurrency[0].toLowerCase() + "_" + _unit.toLowerCase(),
                                result[0].optionLabel, resultValues, true)
                        }
                        else if (_data.type === 'currencyAmount') {
                            resultValues[_data.fieldName + "_" + _data.displayCurrency[0].toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleCurrency(_data, fields, values, _data.fieldName, _data.displayCurrency[0], result[0].optionLabel, resultValues)
                            resultValues = handleFormula(_data, fields, values, _data.fieldName + "_" + _data.displayCurrency[0].toLowerCase(), result[0].optionLabel, resultValues, true)
                        }
                    }
                    else {
                        resultValues[_data.fieldName] = result[0].optionLabel;
                        resultValues = handleFormula(_data, fields, values, _data.fieldName, result[0].optionLabel, resultValues, true)
                    }
                }
            }
        });
    }
    return resultValues;
};

const handleConverter = (fieldData, fields, values, name, _unit, value, resultValues) => {
    let indexConverter = -1;
    fieldData.units.forEach((_f: any, index: any) => {
        if (_f.toLowerCase() === _unit.toLowerCase()) {
            indexConverter = index;
            return;
        }
    })
    if (indexConverter >= 0 && fieldData.unitoption) {
        for (var x_unit in fieldData.unitoption[indexConverter]) {
            if (x_unit !== _unit && (fieldData.displayUnits.includes(x_unit) || (fieldData.formulaUnits && fieldData.formulaUnits.includes(x_unit)))) {
                let calValue = value * fieldData.unitoption[indexConverter][x_unit];
                calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                let fieldName = (name + "_" + x_unit.toLowerCase());
                resultValues[fieldName] = calValue;
                resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues, true);
                resultValues = handleCheckVlookupReverse(fieldData, fields, values, fieldName, calValue, resultValues);
            }
        }
    }
    return resultValues;
};

const handleCurrency = (fieldData, fields, values, name, _currency, value, resultValues) => {
    // if (fieldData.isMulitFormula) {
    //     resultValues[name + "_" + _currency.toLowerCase()] = value;
    //     resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
    // }
    let indexCurrency = fieldData.currency.indexOf(_currency);
    if (indexCurrency >= 0) {
        for (var x_currency in fieldData.currencyoption[indexCurrency]) {
            if (fieldData.displayCurrency.includes(x_currency) && x_currency !== _currency) {
                let _fieldName = name + "_" + x_currency.toLowerCase();
                let calValue = value * fieldData.currencyoption[indexCurrency][x_currency];
                calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                resultValues[_fieldName] = calValue;
                resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues, true);
            }
        }
    }
    return resultValues
};

const handleCurrencyConverter = (fieldData, fields, values, name, _currency, _unit, value, resultValues) => {
    // if (fieldData.isMulitFormula) {
    //     resultValues[name + "_" + _unit.toLowerCase()] = value;
    //     resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
    // }
    let indexConverter = -1;
    fieldData.units.forEach((_f: any, index: any) => {
        if (_f.toLowerCase() === _unit.toLowerCase()) {
            indexConverter = index;
            return;
        }
    })
    let indexCurrency = fieldData.currency.indexOf(_currency);
    if (indexConverter >= 0 && indexCurrency >= 0 && fieldData.unitoption) {
        for (var x_unit in fieldData.unitoption[indexConverter]) {
            for (var x_currency in fieldData.currencyoption[indexCurrency]) {
                if ((fieldData.displayUnits.includes(x_unit) || (fieldData.formulaUnits && fieldData.formulaUnits.includes(x_unit)))
                    && fieldData.displayCurrency.includes(x_currency)) {
                    if (x_currency === _currency && x_unit === _unit) {
                    } else if (x_currency !== _currency && x_unit === _unit) {
                        let calValue = value * fieldData.currencyoption[indexCurrency][x_currency];
                        calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                        let fieldName = name + "_" + x_currency.toLowerCase() + "_" + x_unit.toLowerCase()
                        resultValues[fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues, true);
                    } else {
                        let calValue = value * fieldData.unitoption[indexConverter][x_unit];
                        calValue = calValue * fieldData.currencyoption[indexCurrency][x_currency];
                        calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                        let fieldName = name + "_" + x_currency.toLowerCase() + "_" + x_unit.toLowerCase()
                        resultValues[fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues, true);
                    }
                }
            }
        }
    }
    return resultValues;
};

export const extractFields = (fields) => {
    const result: any = []
    fields.forEach(_field => {
        let ele = { ..._field }
        if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
            if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                ele.formulaUnits && ele.formulaUnits.forEach(_unit => {
                    result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _unit + ")", fieldName: ele.fieldName + "_" + _unit.toLowerCase() })
                })
            }
            else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                ele.displayCurrency && ele.displayCurrency.forEach(_currency => {
                    ele.formulaUnits && ele.formulaUnits.forEach(_unit => {
                        result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _currency + "/" + _unit + ")", fieldName: ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase() })
                    })
                })
            }
            else if (ele.type === 'currencyAmount') {
                ele.displayCurrency && ele.displayCurrency.forEach(_currency => {
                    result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _currency + ")", fieldName: ele.fieldName + "_" + _currency.toLowerCase() })
                })
            }
        }
        else {
            result.push(ele)
        }
    })
    return result
}

export const extractFieldsForDisplay = (fields) => {
    const result: any = []
    fields.forEach(_field => {
        let ele = { ..._field }
        if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
            if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                ele.displayUnits && ele.displayUnits.forEach(_unit => {
                    result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _unit + ")", fieldName: ele.fieldName + "_" + _unit.toLowerCase() })
                })
            }
            else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                ele.displayCurrency && ele.displayCurrency.forEach(_currency => {
                    ele.displayUnits && ele.displayUnits.forEach(_unit => {
                        result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _currency + "/" + _unit + ")", fieldName: ele.fieldName + "_" + _currency.toLowerCase() + "_" + _unit.toLowerCase() })
                    })
                })
            }
            else if (ele.type === 'currencyAmount') {
                ele.displayCurrency && ele.displayCurrency.forEach(_currency => {
                    result.push({ ...ele, fieldLabel: ele.fieldLabel + " (" + _currency + ")", fieldName: ele.fieldName + "_" + _currency.toLowerCase() })
                })
            }
        }
        else {
            result.push(ele)
        }
    })
    return result
}

export const autoCalculate = (values: any, fieldList: any) => {
    const returnvalues: any = values;
    fieldList.forEach((ele: any) => {
        //((ele.type === 'vlookupDropdown' || ele.isVlookup) && ele.isvlookupReverse)
        if (ele.lookup || ele.isUneditable) {
        }
        else {
            let calValues: any = {};
            if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
                if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                    ele.displayUnits && ele.displayUnits.forEach((_unit: any) => {
                        const fieldName = ele.fieldName + '_' + _unit.toLowerCase();
                        if (values[fieldName] && values[fieldName] !== "") {
                            calValues = handleAutoCalculation(
                                ele,
                                fieldList,
                                returnvalues,
                                fieldName,
                                '',
                                _unit,
                                values[fieldName] ? values[fieldName] : 0
                            );
                        }
                    });
                } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                    ele.displayCurrency && ele.displayCurrency.forEach((_currency: any) => {
                        ele.displayUnits && ele.displayUnits.forEach((_unit: any) => {
                            const fieldName = ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase();
                            if (values[fieldName] && values[fieldName] !== "") {
                                calValues = handleAutoCalculation(
                                    ele,
                                    fieldList,
                                    returnvalues,
                                    fieldName,
                                    _currency,
                                    _unit,
                                    values[fieldName] ? values[fieldName] : 0
                                );
                            }
                        });
                    });
                } else if (ele.type === 'currencyAmount') {
                    ele.displayCurrency && ele.displayCurrency.forEach((_currency: any) => {
                        const fieldName = ele.fieldName + '_' + _currency.toLowerCase();
                        if (values[fieldName] && values[fieldName] !== "") {
                            calValues = handleAutoCalculation(
                                ele,
                                fieldList,
                                returnvalues,
                                fieldName,
                                _currency,
                                '',
                                values[fieldName] ? values[fieldName] : 0
                            );
                        }
                    })
                }
            } else {
                if (values[ele.fieldName] && values[ele.fieldName] !== "") {
                    calValues = handleAutoCalculation(
                        ele,
                        fieldList,
                        returnvalues,
                        ele.fieldName,
                        '',
                        '',
                        values[ele.fieldName] || values[ele.fieldName] === 0 ? values[ele.fieldName] : ''
                    );
                }
            }
            for (const x in calValues) {
                if (calValues[x] === 0 || calValues[x] === '' || (values[x] && values[x] !== '')) {
                    delete calValues[x];
                }
            }
            Object.assign(returnvalues, calValues);
        }
    });
    return returnvalues;
};


export const autoCalculateSpecificFields = (inputValues: any, values: any, fieldList: any) => {
    const returnvalues: any = { ...inputValues }
    for (var _fieldName in inputValues) {
        const field: any = fieldList.filter((_f) => _f.fieldName === _fieldName || _f.fieldName === _fieldName.split("_")[0]);
        if (field.length) {
            const fieldData: any = field[0];
            let currency = "";
            let unit = "";
            if (_fieldName.split("_").length) {
                if (fieldData.type !== "currencyAmount" && (fieldData.type === "converter" || fieldData.isConverter === true)) {
                    if (_fieldName.split("_").length === 2) {
                        unit = _fieldName.split("_")[1];
                    }
                } else if (fieldData.type === "currencyAmount" && (fieldData.type === "converter" || fieldData.isConverter === true)) {
                    if (_fieldName.split("_").length === 3) {
                        currency = _fieldName.split("_")[1];
                        unit = _fieldName.split("_")[2];
                    }
                } else if (fieldData.type === "currencyAmount") {
                    if (_fieldName.split("_").length === 2) {
                        currency = _fieldName.split("_")[1];
                    }
                }
            }
            const calValues = handleAutoCalculation(fieldData, fieldList, values, _fieldName, currency, unit, inputValues[_fieldName]);
            Object.assign(returnvalues, calValues);
        }
    }
    return returnvalues
}

export const checkFormulaLoop = (fields) => {
    try {
        var error_field = ""

        var duplicateList = [];
        fields.forEach((_f) => {
            if ((fields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase()).length) > 1) {
                duplicateList.push(_f.fieldLabel)
            }
            if ((fields.filter((_d) => _d.fieldName.toLowerCase() === _f.fieldName.toLowerCase()).length) > 1) {
                duplicateList.push(_f.fieldLabel)
            }
        })
        if (duplicateList.length) {
            duplicateList = uniq(duplicateList)
            var message = "Duplicate Field " + duplicateList.join(",");
            return { error: true, message: message }
        }

        var is_loop = false
        fields.filter((_f) => (_f.type === "formula" || _f.isFormula === true)).forEach(ele => {
            if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
                if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                    let fieldName = ele.fieldName + "_" + ele.displayUnits[0].toLowerCase();
                    handleAutoCalculation(ele, fields, {}, fieldName, "", ele.displayUnits[0], 1)
                }
                else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
                    let fieldName = ele.fieldName + "_" + ele.displayCurrency[0].toLowerCase() + "_" + ele.displayUnits[0].toLowerCase();
                    handleAutoCalculation(ele, fields, {}, fieldName, ele.displayCurrency[0], ele.displayUnits[0], 1)
                }
                else if (ele.type === 'currencyAmount') {
                    let fieldName = ele.fieldName + "_" + ele.displayCurrency[0].toLowerCase();
                    handleAutoCalculation(ele, fields, {}, fieldName, ele.displayCurrency[0], "", 1)
                }
            }
            else {
                handleAutoCalculation(ele, fields, {}, ele.fieldName, "", "", 1)
            }
            if (loop_count > 100) {
                is_loop = true
                error_field = ele.fieldName
                return
            }
        })

        if (is_loop) {
            return { error: true, message: "Field " + error_field + " formula is go into circuler loop" }
        }

        return { error: false, message: "sucess" }
    }
    catch (e) {
        return { error: true, message: e.message }
    }

}

export const checkUniqueValidation = (checkinFields, checkfromFields) => {
    try {
        var error_field = ""

        var is_same = false
        var same_type = ""

        checkinFields.forEach((_f) => {
            if ((checkfromFields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase()).length) > 0) {
                error_field = error_field
                if (checkfromFields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase())[0].templateName) {
                    error_field = error_field +
                        " (Template - " + checkfromFields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase())[0].templateName + ")";
                }
                same_type = "Label";
                is_same = true
            }
            if ((checkfromFields.filter((_d) => _d.fieldName.toLowerCase() === _f.fieldName.toLowerCase()).length) > 0) {
                error_field = error_field
                if (checkfromFields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase())[0].templateName) {
                    error_field = error_field +
                        " (Template - " + checkfromFields.filter((_d) => _d.fieldLabel.trim().toLowerCase() === _f.fieldLabel.trim().toLowerCase())[0].templateName + ")";
                }
                same_type = "Name";
                is_same = true
            }
        })

        if (is_same) {
            return { error: true, message: "Field " + same_type + " " + error_field + "  duplicate" }
        }
        return { error: false, message: "sucess" }
    }
    catch (e) {
        return { error: true, message: e.message }
    }

}


export const checkFieldDependency = (fieldId, sectionId, section) => {
    try {
        var fieldData: any = {}
        section.forEach((row) => {
            if (row.sectionId.toString() === sectionId.toString()) {
                if (row.field.filter(i => i._id.toString() === fieldId.toString()).length) {
                    fieldData = row.field.filter(i => i._id.toString() === fieldId.toString())[0]
                }
            }
        });
        var fieldNames = []
        if (fieldData.type === 'converter' || fieldData.type === 'currencyAmount' || fieldData.isConverter === true) {
            if (fieldData.type !== 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
                fieldData.formulaUnits && fieldData.formulaUnits.forEach((_unit: any) => {
                    fieldNames.push(fieldData.fieldName + '_' + _unit.toLowerCase())
                })
            }
            else if (fieldData.type === 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
                fieldData.displayCurrency && fieldData.displayCurrency.forEach((_currency: any) => {
                    fieldData.formulaUnits && fieldData.formulaUnits.forEach((_unit: any) => {
                        fieldNames.push(fieldData.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase())
                    });
                });
            }
            else if (fieldData.type === 'currencyAmount') {
                fieldData.displayCurrency && fieldData.displayCurrency.forEach((_currency: any) => {
                    fieldNames.push(fieldData.fieldName + '_' + _currency.toLowerCase())
                });
            }
        }
        else {
            fieldNames.push(fieldData.fieldName ? fieldData.fieldName : camelCase(fieldData.fieldLabel.replace(/[^a-zA-Z0-9]/g, '')))
        }
        var used_Fields = []
        section.forEach((row) => {
            row.field.forEach((_field) => {
                fieldNames.forEach((_fieldName) => {
                    if (_field.inputFields && _field.inputFields.includes(_fieldName)) {
                        used_Fields.push(_field.fieldLabel)
                    }
                    if (_field.formulaFields && _field.formulaFields.includes(_fieldName)) {
                        used_Fields.push(_field.fieldLabel)
                    }
                    if (_field.formulainputFields && _field.formulainputFields.includes(_fieldName)) {
                        used_Fields.push(_field.fieldLabel)
                    }
                    if (_field.dropdowDependentOn && _field.dropdowDependentOn.includes(_fieldName)) {
                        used_Fields.push(_field.fieldLabel)
                    }
                })
            });
        });
        if (used_Fields.length) {
            used_Fields = uniq(used_Fields);
            return { error: true, message: "This field used in " + used_Fields.join() + " fields." }
        }
        else {
            return { error: false, message: "" }
        }
    }
    catch (e) {
        return { error: true, message: "Error in Delete" }
    }
}

export const optionConverter = (option, units, unitoption, dropdownOnConverter, _unit) => {
    const result = JSON.parse(JSON.stringify(option))
    let indexConverter = units.indexOf(dropdownOnConverter);
    if (indexConverter >= 0 && unitoption) {
        result.forEach((ele) => {
            const calValue = (ele.optionValue * unitoption[indexConverter][_unit]).toString()
            ele.optionLabel = calValue
            ele.optionValue = calValue
        })
    }
    return result;
}

// export const checkFormula = (formula) => {

//     let isValid = true
//     const IfFunction = matchIf(formula)
//     if (IfFunction.length) {
//         for (var _data of IfFunction) {
//             if (_data !== "") {
//                 let parser = new FormulaParser();
//                 parser.setFunction('IF', function (params) {
//                     if (params[0]) {
//                         return params[1]
//                     }
//                     else {
//                         return params[2]
//                     }
//                 });
//                 let ifField = matchField(_data.toString())
//                 for (var _field of ifField) {
//                     parser.setVariable(_field, 1);
//                 }
//                 let result = parser.parse("IF" + removeBracket(_data));
//                 if (result.error) {
//                     isValid = false
//                 }
//                 else {
//                     formula = formula.replace("IF" + _data, result.result)
//                 }
//             }
//         }
//     }
//     var parser = new FormulaParser();
//     const Fields = matchField(formula)
//     for (var _Field of Fields) {
//         parser.setVariable(_Field, 1);
//     }
//     let result = parser.parse(removeBracket(formula))
//     if (result.error) {
//         isValid = false
//     }
//     return isValid
// }


// export const getFormulaValue = (formula, values, returnType, decimalPlaces) => {

//     let value = 0
//     const IfFunction = matchIf(formula)
//     if (IfFunction.length) {
//         for (var _data of IfFunction) {
//             if (_data !== "") {
//                 let parser = new FormulaParser();
//                 parser.setFunction('IF', function (params) {
//                     if (params[0]) {
//                         return params[1]
//                     }
//                     else {
//                         return params[2]
//                     }
//                 });
//                 let ifField = matchField(_data.toString())
//                 for (var _field of ifField) {
//                     parser.setVariable(_field, values[_field]);
//                 }
//                 let result = parser.parse("IF" + removeBracket(_data));
//                 if (!result.error) {
//                     formula = formula.replace("IF" + _data, result.result)
//                 }
//             }
//         }
//     }
//     var parser = new FormulaParser();
//     const Fields = matchField(formula)
//     for (var _field of Fields) {
//         parser.setVariable(_field, values[_field]);
//     }
//     let result = parser.parse(removeBracket(formula))
//     if (!result.error) {
//         value = result.result
//     }
//     if (returnType === "decimal") {
//         value = parseFloat(value.toFixed(decimalPlaces))
//     }
//     return value
// }