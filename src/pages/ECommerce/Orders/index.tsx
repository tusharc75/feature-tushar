import { Box } from '@material-ui/core';
import React, { useEffect, useContext, useState } from 'react';
import axiosInstance from '../../../axios/axiosInstance';
import ECommerceBreadCrumbs from '../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

export default function Orders() {

    const toastConfig = useContext(CustomToastContext);
    const [orders, setOrders] = useState([]);


    useEffect(() => {
        axiosInstance().get("/ecommerce/order").then(({ data: { data } }) => {
            debugger;
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        })
    }, [])

    return <div className="container">
        <div className="p-2">
            <ECommerceBreadCrumbs routes={[{ title: "Orders" }]} />
        </div>
        <Box>


        </Box>
    </div>
}
