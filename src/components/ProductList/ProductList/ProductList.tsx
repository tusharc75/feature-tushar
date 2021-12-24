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

const ProductList = ({ products, fetchData, count, loadMoreData, loading }) => {

    const [addedCartItems, setAddedCartItems] = useState([])
    const [category, setCategory] = useState("");
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
                    <CategorySidebar fetchData={fetchData} setCategory={setCategory} />
                </Paper>
            </div>

            <div className="position-relative">
                {/* {
                    category && <div className="w-100 p-2 mb-2" style={{ background: "white", borderRadius: 5 }}>
                        <span className="font-weight-bold font-size-3">
                            Category: {category}
                        </span>
                    </div>
                } */}

                <InfiniteScroll
                    dataLength={count}
                    height="calc(100vh - 115px)"
                    next={() => {
                        setTimeout(() => {
                            loadMoreData()
                            // fetchData();
                        }, 1500)
                    }}
                    hasMore={products.length !== count}
                    loader={
                        <h4 className="text-center border mt-3 p-3 loading-dots">
                            Loading more product(s)
                        </h4>
                    }
                >
                    {
                        products.length !== 0 ? <div className={`${styles.product_list_container}`}>
                            {
                                products.map((product, index: number) => (
                                    <Product key={index} product={product}
                                        onAddItem={onAddToCartItem}
                                    />
                                ))
                            }
                        </div> : <div className="p-5 d-flex align-items-center justify-content-center" style={{ background: "white" }}>
                            <h2 className={loading ? "loading-dots" : ""}>
                                {
                                    loading ? "Loading product(s)" : "No product(s) found"
                                }
                            </h2>
                        </div>
                    }


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