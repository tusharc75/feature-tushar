import currencies from "./currency_with_country.json";

export const getObjKeys = (val = "", arr) => {
    const obj = {};
    for (const key of arr) {
        if (key.type === "dropDown") {
            obj[key.fieldName] = val
                ? val
                : key.option?.find((item) => item.default === true);
        } else if (key.type === "currency") {
            obj[key.fieldName] = val
                ? val
                : currencies?.find((item) => item.countryCode === "USA");
        } else if (key.type === "multiSelect") {
            const defaultOptions = key.option?.filter(
                (item) => item.default === true
            );
            obj[key.fieldName] = val ? val : defaultOptions;
        } else if (key.type === "switch" || key.type === "checkBox") {
            obj[key.fieldName] = val ? val : false;
        } else {
            obj[key.fieldName] = val;
        }
    }

    return obj;
};

export const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};