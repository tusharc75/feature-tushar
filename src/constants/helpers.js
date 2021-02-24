export const getObjKeys = (val = "", arr) => {
    const obj = {};
    for (const key of arr) {
        if (key.type === "dropDown") {
            obj[key.fieldName] = val ? val : key.option[0].optionLabel;
        } else if (key.type === "multiSelect") {
            obj[key.fieldName] = val ? val : [];
        } else if (key.type === "switch") {
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