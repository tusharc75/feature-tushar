import axios from "axios";

const BASE_URL = "https://equipt-oms-v2.herokuapp.com";
// const BASE_URL = "http://localhost:4000";

const api = () => {
    const token = localStorage.getItem("token");

    return axios.create({
        baseURL: BASE_URL,
        headers: { authorization: `Bearer ${token}` },
    });
};

export const UserLogin = async (inputData) => {
    const { data } = await axios.post(`${BASE_URL}/user/login`, inputData);
    return data;
};

export const UserMe = async () => {
    const { data } = await api().get(`${BASE_URL}/user/me`);
    return data;
};

export const GetContacts = async () => {
    const { data } = await api().get(`${BASE_URL}/contact`);
    return data;
};

export const GetFields = async (resource, id) => {
    const { data } = await api().get(`/sa-field?brand=${id}&resource=${resource}`);
    return data;
};

export const GetAccounts = async (params) => {
    // const { data } = await api().get(`${BASE_URL}/account?brand=${brandId}`);
    let url = "/account";
    url = getSearchQuery(url, params);
    const { data } = await api().get(url);
    return data;
};

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
