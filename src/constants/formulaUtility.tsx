import { Parser as FormulaParser } from 'hot-formula-parser';


const removeBracket = (string) => {
    return string.replace(/{/g, '').replace(/}/g, '')
}

const matchField = (string) => {
    return Array.from(string.matchAll(/{([^}]+)}/g), x => x[1])
}

const matchIf = (string) => {
    return Array.from(string.matchAll(/\IF(.*?\))/g), x => x[1])
}

export const checkFormula = (formula, inputFields) => {
    let isValid = true
    try {
        let argument = [];
        let values = [];
        for (var x in inputFields) {
            argument.push(x)
            values.push(inputFields[x])
        }
        var fs: any = [];
        fs['f1'] = new Function(...argument, formula);
        let result = fs['f1'].apply(null, values);
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
        for (var x in inputFields) {
            argument.push(x)
            values.push(inputFields[x])
        }
        var fs: any = [];
        fs['f1'] = new Function(...argument, formula);
        value = fs['f1'].apply(null, values);
        if (returnType === "decimal") {
            value = parseFloat(value.toFixed(decimalPlaces))
        }
    }
    catch (e) {
    }
    return value
}

const formatDecimal = (value, decimalPlaces) => {
    if (value === "" && isNaN(value)) {
        return 0;
    }
    else if (parseFloat(value) < 0) {
        return 0;
    }
    else {
        return parseFloat(value.toFixed(decimalPlaces));
    }
};

export const handleAutoCalculation = (fieldData, fields, values, name, currency, unit, value) => {
    let resultValues: any = {}
    resultValues[name] = value;
    try {
        if (fieldData && fieldData.isMulitFormula) {
            resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
        }
        if (fieldData.type === "vlookupDropdown" || fieldData.isVlookup) {
            resultValues = handleVlookup(fieldData, fields, values, name, value, resultValues);
        }
        resultValues = handleFormula(fieldData, fields, values, name, value, resultValues);
        resultValues = handleCheckVlookupReverse(fieldData, fields, values, name, value, resultValues);
        if (fieldData.type !== 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
            resultValues = handleConverter(fieldData, fields, values, fieldData.fieldName, unit, value, resultValues);

        } else if (fieldData.type === 'currencyAmount' && (fieldData.type === 'converter' || fieldData.isConverter === true)) {
            resultValues = handleCurrencyConverter(fieldData, fields, values, fieldData.fieldName, currency, unit, value, resultValues);
        }
        else if (fieldData.type === 'currencyAmount') {
            resultValues = handleCurrency(fieldData, fields, values, fieldData.fieldName, currency, value, resultValues);
        }
    }
    catch (e) {
    }
    console.log(resultValues)
    return resultValues
}

const handleMulitFormula = (fieldData, fields, values, resultValues) => {
    fieldData.formulaFields.forEach((_field) => {
        let formulainputFields = {};
        fieldData.formulainputFields.forEach((_input) => {
            formulainputFields[_input] = resultValues[_input] || resultValues[_input] === 0 ? resultValues[_input] : values[_input] ? values[_input] : 0;
        });
        let calValue = getFormulaValue(fieldData.formulaoption[_field], formulainputFields, "decimal", fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
        resultValues[_field] = calValue;
        resultValues = handleFormula(fieldData, fields, values, _field, calValue, resultValues);
        if (fieldData.displayUnits && fieldData.displayUnits.length) {
            resultValues = handleConverter(fieldData, fields, values, fieldData.fieldName, fieldData.displayUnits[0], calValue, resultValues);
        }
    });
    return resultValues
};

const handleFormula = (fieldData, fields, values, name, value, resultValues) => {
    if (fields && fields.filter((_f) => _f.type === "formula" || _f.isFormula === true).length) {
        fields.filter((_f) => _f.type === "formula" || _f.isFormula === true).forEach((_data) => {
            if (_data.inputFields.includes(name)) {
                let inputFields = {};
                _data.inputFields.forEach((_input) => {
                    if (name === _input) {
                        inputFields[_input] = value;
                    } else {
                        inputFields[_input] = resultValues[_input] ? resultValues[_input] : values[_input] ? values[_input] : 0;
                    }
                });
                let calValue = getFormulaValue(_data.formula, inputFields, _data.returnType, _data.decimalPlaces);
                calValue = formatDecimal(calValue, _data.decimalPlaces ? _data.decimalPlaces : 2);
                let _fieldName = _data.fieldName;
                if (_data.type === "currencyAmount" || _data.type === "converter" || _data.isConverter) {
                    if (_data.displayCurrency && _data.displayCurrency.length) {
                        _fieldName = _fieldName + "_" + (_data.formulaOnCurrency && _data.formulaOnCurrency !== "" ? _data.formulaOnCurrency.toLowerCase() : _data.displayCurrency[0].toLowerCase())
                    }
                    if (_data.displayUnits && _data.displayUnits.length) {
                        _fieldName = _fieldName + "_" + (_data.formulaOnConverter && _data.formulaOnConverter !== "" ? _data.formulaOnConverter.toLowerCase() : _data.displayUnits[0].toLowerCase())
                    }

                    if (resultValues[_fieldName] === undefined) {
                        resultValues[_fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues);
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
                        else if (_data.displayCurrency && _data.displayCurrency.length) {
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
                        else if (_data.displayUnits && _data.displayUnits.length) {
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
                        if (_data.isMulitFormula) {
                            resultValues = handleMulitFormula(_data, fields, values, resultValues);
                        }
                    }
                } else {
                    if (resultValues[_fieldName] === undefined) {
                        resultValues[_fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues);
                        if (_data.isMulitFormula) {
                            resultValues = handleMulitFormula(_data, fields, values, resultValues);
                        }
                    }
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
                    resultValues = handleFormula(fieldData, fields, values, x, result[0][x], resultValues)
                }
            }
        }
    }
    return resultValues;
};

const handleCheckVlookupReverse = (fieldData, fields, values, name, value, resultValues) => {
    if (fields && fields.filter((_f) => (_f.type === "vlookupDropdown" || _f.isVlookup) && !_f.isvlookupReverse).length) {
        fields.filter((_f) => (_f.type === "vlookupDropdown" || _f.isVlookup) && !_f.isvlookupReverse).forEach((_data) => {
            if (_data.inputFields.includes(name)) {
                let result = _data.option && _data.option.filter(function (val) {
                    for (var i = 0; i < _data.inputFields.length; i++)
                        if ((_data.inputFields[i] === name ? value.toString() : values[_data.inputFields[i]].toString()) !== val[_data.inputFields[i].toString()])
                            return false;
                    return true;
                });
                if (result.length) {
                    if (_data.type === "currencyAmount" || _data.type === "converter" || _data.isConverter) {
                        if (_data.type !== 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            resultValues[_data.fieldName + "_" + _data.displayUnits[0].toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleConverter(_data, fields, values, _data.fieldName, _data.displayUnits[0], result[0].optionLabel, resultValues)
                        }
                        else if (_data.type === 'currencyAmount' && (_data.type === 'converter' || _data.isConverter === true)) {
                            resultValues[_data.fieldName + "_" + _data.displayCurrency[0].toLowerCase() + "_" + _data.displayUnits[0].toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleCurrencyConverter(_data, fields, values, _data.fieldName, _data.displayCurrency[0], _data.displayUnits[0], result[0].optionLabel, resultValues)
                        }
                        else if (_data.type === 'currencyAmount') {
                            resultValues[_data.fieldName + "_" + _data.displayCurrency[0].toLowerCase()] = parseFloat(result[0].optionLabel);
                            resultValues = handleCurrency(_data, fields, values, _data.fieldName, _data.displayCurrency[0], result[0].optionLabel, resultValues)
                        }
                    }
                    else {
                        resultValues[_data.fieldName] = result[0].optionLabel;
                        resultValues = handleFormula(_data, fields, values, _data.fieldName, result[0].optionLabel, resultValues)
                    }
                }
            }
        });
    }
    return resultValues;
};

const handleConverter = (fieldData, fields, values, name, _unit, value, resultValues) => {
    let indexConverter = fieldData.units.indexOf(_unit);
    if (indexConverter >= 0) {
        for (var x_unit in fieldData.option[indexConverter]) {
            if (x_unit !== _unit) {
                let calValue = value * fieldData.option[indexConverter][x_unit];
                calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                let fieldName = (name + "_" + x_unit.toLowerCase());
                resultValues[fieldName] = calValue;
                resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues);
            }
        }
    }
    return resultValues;
};

const handleCurrency = (fieldData, fields, values, name, _currency, value, resultValues) => {
    if (fieldData.isMulitFormula) {
        resultValues[name + "_" + _currency.toLowerCase()] = value;
        resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
    }
    let indexCurrency = fieldData.currency.indexOf(_currency);
    if (indexCurrency >= 0) {
        for (var x_currency in fieldData.currencyoption[indexCurrency]) {
            if (fieldData.displayCurrency.includes(x_currency) && x_currency !== _currency) {
                let _fieldName = name + "_" + x_currency.toLowerCase();
                let calValue = value * fieldData.currencyoption[indexCurrency][x_currency];
                calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                resultValues[_fieldName] = calValue;
                resultValues = handleFormula(fieldData, fields, values, _fieldName, calValue, resultValues);
            }
        }
    }
    return resultValues
};

const handleCurrencyConverter = (fieldData, fields, values, name, _currency, _unit, value, resultValues) => {
    if (fieldData.isMulitFormula) {
        resultValues[name + "_" + _unit.toLowerCase()] = value;
        resultValues = handleMulitFormula(fieldData, fields, values, resultValues);
    }
    let indexConverter = fieldData.units.indexOf(_unit);
    let indexCurrency = fieldData.currency.indexOf(_currency);
    if (indexConverter >= 0 && indexCurrency >= 0) {
        for (var x_unit in fieldData.option[indexConverter]) {
            for (var x_currency in fieldData.currencyoption[indexCurrency]) {
                if (
                    fieldData.displayUnits.includes(x_unit) &&
                    fieldData.displayCurrency.includes(x_currency)
                ) {
                    if (x_currency === _currency && x_unit === _unit) {
                    } else if (x_currency !== _currency && x_unit === _unit) {
                        let calValue = value * fieldData.currencyoption[indexCurrency][x_currency];
                        calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                        let fieldName = name + "_" + x_currency.toLowerCase() + "_" + x_unit.toLowerCase()
                        resultValues[fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues);
                    } else {
                        let calValue = value * fieldData.option[indexConverter][x_unit];
                        calValue = calValue * fieldData.currencyoption[indexCurrency][x_currency];
                        calValue = formatDecimal(calValue, fieldData.decimalPlaces ? fieldData.decimalPlaces : 2);
                        let fieldName = name + "_" + x_currency.toLowerCase() + "_" + x_unit.toLowerCase()
                        resultValues[fieldName] = calValue;
                        resultValues = handleFormula(fieldData, fields, values, fieldName, calValue, resultValues);
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