import React, { useState, useEffect, Fragment, useContext } from "react";
import Box from '@material-ui/core/Box';
import ProductBuilder from './index';
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

const Master = (props) => {

    const { relatedTo } = props;
    const [productBuilderId, setProductBuilderId] = useState(null);
    const toastConfig = useContext(CustomToastContext)

    useEffect(() => {
        axiosInstance().post(`/productbuilder/checkreletedto`, { relatedTo: relatedTo }).then(({ data: { data } }) => {
            setProductBuilderId(data.productBuilderId)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, []);


    return (<Box>
        {productBuilderId &&
            <ProductBuilder productBuilderId={productBuilderId} />}
    </Box>
    );
}

export default Master;
