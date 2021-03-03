export const validateEmail = (value) => {
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;

    if (reg.test(value) == false) {
        return false;
    }

    return true;
}
export const getSearchQuery = (url, params) => {
    if (params && Object.keys(params).length > 0) {
        url = url.indexOf("?") >= 0 ? url + "&" : url + "?";
        Object.keys(params).forEach((k, i) => {
            url = url + `${k}=${params[k]}`;
            if (i < Object.keys(params).length - 1) {
                url = url + "&";
            }
        });
    }
    return url
}
export const getErrorMessage = (err) => {
    if (err?.response?.data) {
        if (err.response.data.message) {
            return err.response.data.message
        }
        else if (err.response.data.error) {
            return err.response.data.error
        }
    }
    return ''
}
export const capitalize = (string) => {
    return string && typeof string === "string" ? string.charAt(0).toUpperCase() + string.slice(1) : string;
};

