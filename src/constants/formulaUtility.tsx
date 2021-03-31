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

export const checkFormula = (formula) => {

    let isValid = true
    const IfFunction = matchIf(formula)
    if (IfFunction.length) {
        for (var _data of IfFunction) {
            if (_data !== "") {
                let parser = new FormulaParser();
                parser.setFunction('IF', function (params) {
                    if (params[0]) {
                        return params[1]
                    }
                    else {
                        return params[2]
                    }
                });
                let ifField = matchField(_data.toString())
                for (var _field of ifField) {
                    parser.setVariable(_field, 1);
                }
                let result = parser.parse("IF" + removeBracket(_data));
                if (result.error) {
                    isValid = false
                }
                else {
                    formula = formula.replace("IF" + _data, result.result)
                }
            }
        }
    }
    var parser = new FormulaParser();
    const Fields = matchField(formula)
    for (var _Field of Fields) {
        parser.setVariable(_Field, 1);
    }
    let result = parser.parse(removeBracket(formula))
    if (result.error) {
        isValid = false
    }
    return isValid
}

export const getFormulaValue = (formula, values, returnType, decimalPlaces) => {

    let value = 0
    const IfFunction = matchIf(formula)
    if (IfFunction.length) {
        for (var _data of IfFunction) {
            if (_data !== "") {
                let parser = new FormulaParser();
                parser.setFunction('IF', function (params) {
                    if (params[0]) {
                        return params[1]
                    }
                    else {
                        return params[2]
                    }
                });
                let ifField = matchField(_data.toString())
                for (var _field of ifField) {
                    parser.setVariable(_field, values[_field]);
                }
                let result = parser.parse("IF" + removeBracket(_data));
                if (!result.error) {
                    formula = formula.replace("IF" + _data, result.result)
                }
            }
        }
    }
    var parser = new FormulaParser();
    const Fields = matchField(formula)
    for (var _field of Fields) {
        parser.setVariable(_field, values[_field]);
    }
    let result = parser.parse(removeBracket(formula))
    if (!result.error) {
        value = result.result
    }
    if (returnType === "decimal") {
        value = parseFloat(value.toFixed(decimalPlaces))
    }
    return value
}