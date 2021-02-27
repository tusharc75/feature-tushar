import axios from "axios";
import { getSearchQuery } from '../services/util'
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

export const GetAccounts = async (params) => {
    let url = "/account";
    url = getSearchQuery(url, params);
    const { data } = await api().get(url);
    return data;
};


export const GetFields = async (resource, id) => {
    const { data } = await api().get(`/field?resource=${resource}`);
    return data;
};

export const checkEmailExist = async (email) => {
    const { data } = await api().get(`/user/emailExist/${email}`);
    return data;
};
