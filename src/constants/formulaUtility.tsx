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
        console.log(e)
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
        console.log(e)
    }
    return value
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