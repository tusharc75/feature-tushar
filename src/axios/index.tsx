import api from './axios'
import { getSearchQuery } from '../services/util'

export const GetAccounts = async (params) => {
    let url = "/account";
    url = getSearchQuery(url, params);
    const { data } = await api().get(url);
    return data;
};



export const GetContacts = async (params) => {
    let url = "/contact";
    url = getSearchQuery(url, params);
    const { data } = await api().get(url);
    return data;
};

export const checkEmailExist = async (email) => {
    const { data } = await api().get(`/user/emailExist/${email}`);
    return data;
};
export const RemoveContacts = async (obj) => {
    let url = "/contact/remove";
    const { data } = await api().put(url, obj);
    return data;
};



