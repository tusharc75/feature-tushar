
import { useState, useEffect, useContext, Fragment } from 'react';
import { Link } from 'react-router-dom'
import { CHILD_RESOURCE } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import { CURReplaceByCurrencySingle } from '../../constants/formulaUtility';

export const fetch_sublease_product_fields = async (currency) => {
    var data;
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.subleaseProduct}`);
    data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, currency ? currency : "USD");
    return data;
}
