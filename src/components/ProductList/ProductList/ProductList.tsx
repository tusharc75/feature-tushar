import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Product from '../ProductCard/ProductCard';
// import { mockData } from '../../assets/mockData';
import styles from './product-list.module.scss'
import { Grid, Box } from "@material-ui/core";
import CategorySidebar from "../CategorySidebar/CategorySidebar"
import CustomBreadCrumbs from '../../CustomBreadCrumbs';
import axiosInstance from "../../../axios/axiosInstance";
import Layout from '../../Layout';

const ProductList = ({ products }) => {

    const [addedCartItems, setAddedCartItems] = useState([])
    const [checkoutLabel, setCheckoutLabel] = useState("Checkout")

    useEffect(() => {
        fetchCart()
    }, [])

    const fetchCart = () => {
        axiosInstance()
            .get(`/user/cart`).then(({ data: { data } }) => {

                if (data) {
                    setAddedCartItems(data)
                }
                if (data && data.length >= 4) {
                    setCheckoutLabel("Create Quote")
                }
            })
    }
    const onAddToCartItem = (item, data) => {
        let tempQuantity = 1
        addedCartItems.some(o => {
            if (o.productId === item._id) {
                tempQuantity = tempQuantity + 1
                return true
            }
        })

        axiosInstance()
            .post(`/user/cart`, {
                products: [{
                    quantity: `${tempQuantity}`,
                    productId: item._id
                }]
            }).then(({ data }) => {
                fetchCart()
            })
    }
    return (
        <>
            <div className={styles.wrapper}>

                <CategorySidebar />


                <Box className="detail-container">
                    <div className={`${styles.product_list_container}`}>
                        {
                            products.map((product, index: number) => (
                                <Product key={index} product={product}
                                    onAddItem={onAddToCartItem}
                                />
                            ))
                        }
                    </div>
                </Box>
            </div>
        </>
    );
}

ProductList.propTypes = {
    products: PropTypes.array,
}

export default ProductList;