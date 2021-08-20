import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Product from '../ProductCard/ProductCard';
// import { mockData } from '../../assets/mockData';
import styles from './product-list.module.scss'
import { Grid, Box, Paper } from "@material-ui/core";
import CategorySidebar from "../CategorySidebar/CategorySidebar"
import CustomBreadCrumbs from '../../CustomBreadCrumbs';
import axiosInstance from "../../../axios/axiosInstance";
import routes from '../../Helpers/Routes';
import InfiniteScroll from 'react-infinite-scroll-component';
import { SET_CART_COUNT } from "../../../StateProvider/actionTypes"
import { useData } from "../../../StateProvider/Provider";

const ProductList = ({ products, fetchData, count }) => {

    const [addedCartItems, setAddedCartItems] = useState([])
    const [checkoutLabel, setCheckoutLabel] = useState("Checkout")
    const { dispatch }: any = useData();
    useEffect(() => {
        fetchCart()
    }, [])

    const fetchCart = () => {
        axiosInstance()
            .get(`/user/cart`).then(({ data: { data } }) => {

                if (data) {
                    dispatch({ type: SET_CART_COUNT, payload: data.length });
                    setAddedCartItems(data)
                }
                if (data && data.length >= 4) {
                    setCheckoutLabel("Create Quote")
                }
            })
    }
    const onAddToCartItem = (item) => {
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
            }).then(() => {
                fetchCart()
            })
    }
    return (<>
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[{ title: routes.productList.title }]} />
        </Grid>
        <div className="detail-container grid-product-category pr-0">
            <div>
                <Paper>
                    <CategorySidebar />
                </Paper>
            </div>

            <div className="position-relative">
                <InfiniteScroll
                    dataLength={count}
                    height="calc(100vh - 115px)"
                    next={() => {
                        setTimeout(() => {
                            fetchData();
                        }, 1500)
                    }}
                    hasMore={products.length !== count}
                    loader={
                        <h3 className="text-center border mt-3 p-3 loading-dots">
                            Loading more items
                        </h3>
                    }
                >
                    <div className={`${styles.product_list_container}`}>

                        {
                            products.map((product, index: number) => (
                                <Product key={index} product={product}
                                    onAddItem={onAddToCartItem}
                                />
                            ))
                        }
                    </div>

                </InfiniteScroll>
            </div>
        </div>
    </>
        // <Layout>
        //     <Grid container className="headerbox">
        //         <CustomBreadCrumbs routes={[{ title: "Hi" }]} />
        //     </Grid>
        //     <Box className="detail-container">
        //         <div className={styles.wrapper}>

        //             <CategorySidebar />

        //             <div className={`${styles.product_list_container}`}>
        //                 {
        //                     products.map((product, index: number) => (
        //                         <Product key={index} product={product}
        //                             onAddItem={onAddToCartItem}
        //                         />
        //                     ))
        //                 }
        //             </div>
        //         </div>
        //     </Box>
        // </Layout>
    );
}

ProductList.propTypes = {
    products: PropTypes.array,
}

export default ProductList;