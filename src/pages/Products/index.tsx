import React, { useEffect, useState, useContext, Fragment, useCallback } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import ProductList from '../../components/ProductList/ProductList/ProductList';
import { product } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

export default function Products() {

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [categoryId, setCategoryId] = useState(null);
    const limit = 21;
    const toastConfig = useContext(CustomToastContext);

    const fetchData = useCallback(() => {
        if (categoryId) {
            axiosInstance().get(`${product.api}?page=${page}&limit=${limit}&deepFilter=[{"field":"productCategory","term":"${categoryId}"}]&filterType=and`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts(prevState => [...prevState, ...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else {
            axiosInstance().get(`${product.api}?page=${page}&limit=${limit}`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts(prevState => [...prevState, ...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
    }, [page])

    useEffect(() => {
        fetchData();
    }, [fetchData])

    useEffect(() => {
        setPage(0);
        setTotalCount(0);
        setProducts([]);
    }, [categoryId])

    return (
        <Fragment>
            {
                products && <ProductList
                    products={products}
                    fetchData={(categoryId) => {
                        if (categoryId) {
                            setCategoryId(categoryId)
                        }
                        else {
                            setPage(prevState => prevState + 1)
                        }
                    }}
                    count={totalCount}
                />
            }
        </Fragment>
    )
}
