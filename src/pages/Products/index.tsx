import React, { useEffect, useState, useContext, Fragment, useCallback } from 'react'
import axiosInstance from '../../axios/axiosInstance';
import ProductList from '../../components/ProductList/ProductList/ProductList';
import { eProduct } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';

export default function Products() {

    const limit = 21;
    const toastConfig = useContext(CustomToastContext);

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [categoryId, setCategoryId] = useState(null);
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchData(null, 0)
    }, [])

    const fetchData = (categoryId, page) => {
        setLoading(true);

        if (categoryId) {
            axiosInstance().get(`${eProduct.api}?page=${page}&limit=${limit}&deepFilter=[{"field":"productCategory","term":"${categoryId}"}]&filterType=and`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts(prevState => [...prevState, ...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });
        }
        else if (page !== 0) {
            axiosInstance().get(`${eProduct.api}?page=${page}&limit=${limit}`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts(prevState => [...prevState, ...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });
        } else {
            axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts([...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });
        }
    }

    return (
        <Fragment>
            {
                products && <ProductList
                    products={products}
                    loading={loading}
                    fetchData={(categoryId) => {
                        if (categoryId) {
                            setPage(0);
                            setTotalCount(0);
                            setProducts([]);

                            fetchData(categoryId, 0)
                        }
                        else {
                            fetchData(null, 0)
                        }
                    }}
                    loadMoreData={() => {
                        fetchData(categoryId, page + 1)
                        setPage(prevState => prevState + 1)
                    }}
                    count={totalCount}
                />
            }
        </Fragment>
    )
}
