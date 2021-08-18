import React, { useEffect, useState, useContext, Fragment, useCallback } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import ProductList from '../../components/ProductList/ProductList/ProductList';
import { product } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

export default function Products() {

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);

    const toastConfig = useContext(CustomToastContext);

    const fetchData = useCallback(() => {
        axiosInstance().get(`${product.api}?page=${page}&limit=21`).then(({ data: { data, count } }) => {
            setTotalCount(count);
            setProducts(prevState => [...prevState, ...data]);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    }, [page])

    useEffect(() => {
        fetchData();
    }, [fetchData])

    return (
        <Fragment>
            {
                products && <ProductList products={products} fetchData={() => { setPage(prevState => prevState + 1) }} count={totalCount} />
            }
        </Fragment>
    )
}
