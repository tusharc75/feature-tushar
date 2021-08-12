import React, { useEffect, useState, useContext, Fragment } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import Layout from '../../components/Layout';
import ProductList from '../../components/ProductList/ProductList/ProductList';
import { product } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

export default function Products() {

    const [products, setProducts] = useState([]);
    const toastConfig = useContext(CustomToastContext);

    useEffect(() => {
        axiosInstance().get(`${product.api}?limit=0`).then(({ data: { data } }) => {
            setProducts(data);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, [])

    return (
        <Fragment>
            {
                products && <ProductList products={products} />
            }
        </Fragment>
    )
}
