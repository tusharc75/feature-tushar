import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Product from '../ProductCard/ProductCard';
import styles from './product-list.module.scss'
import { Grid, Paper } from "@material-ui/core";
import CategorySidebar from "../CategorySidebar/CategorySidebar"
import CustomBreadCrumbs from '../../CustomBreadCrumbs';
import axiosInstance from "../../../axios/axiosInstance";
import routes from '../../Helpers/Routes';
import InfiniteScroll from 'react-infinite-scroll-component';
import { SET_CART_COUNT } from "../../../StateProvider/actionTypes"
import { useData } from "../../../StateProvider/Provider";

const ProductList = ({ products, fetchData, count }) => {

    const [addedCartItems, setAddedCartItems] = useState([])
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
            <CustomBreadCrumbs routes={[{ title: routes.eCommerce.title }]} />
        </Grid>
        <div className="detail-container grid-product-category pr-0">
            <div>
                <Paper>
                    <CategorySidebar fetchData={fetchData} />
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
    );
}

ProductList.propTypes = {
    products: PropTypes.array,
}

export default ProductList;