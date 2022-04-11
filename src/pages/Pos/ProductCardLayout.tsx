import InfiniteScroll from 'react-infinite-scroll-component';
import ProductCard from '../../components/ProductCard/index'
import axiosInstance from "src/axios/axiosInstance";
import { makeStyles } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import styles from './pos-page.module.scss'
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';


const useStyles = makeStyles((theme) => ({
    flexGrow1: {
        flex:1,
        flexGrow: 1,
    },
}));

const ProductCardLayout = ({ handleAddToCart, plantId, searchVal }) => {
    const limit = 20
    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (plantId) fetchProducts();
    }, [searchVal]);

    const fetchProducts = () => {
        setProducts([]);
        setLoading(true);
        let api = searchVal ? `/pos?wareHouse=${plantId}&page=${page}&limit=${limit}&search=${searchVal}` : `/pos?wareHouse=${plantId}&page=0&limit=${limit}`;

        axiosInstance().get(api).then(({ data: { data, count } }) => {
            setProducts([...data]);
            setHasMore(data.length !== count);
            setTotalCount(count)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            setLoading(false);

        })

    }

    const fetchMoreData = () => {
        setTimeout(() => {
            let api = searchVal ? `/pos?wareHouse=${plantId}&page=${page}&limit=${limit}&search=${searchVal}` : `/pos?wareHouse=${plantId}&page=0&limit=${limit}`;
            axiosInstance().get(api).then(({ data: { data, count } }) => {
                setPage(prevState => prevState + 1)
                setProducts(prevState => [...prevState, ...data]);

                if ((products.length + data.length) >= count) {
                    setHasMore(false);
                }

            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                // setLoading(false);
            });

        }, 500)
    }
    return (
        <div className={classes.flexGrow1}>

            <div id="scrollableDiv" style={{ height: "90vh", overflowY: "auto" }}>
                <InfiniteScroll
                    dataLength={products.length}
                    next={() => { fetchMoreData() }}
                    hasMore={hasMore}
                    loader={
                        <h4 className="text-center border mt-3 p-3 loading-dots">
                            Loading more product(s)
                        </h4>
                    }
                    scrollableTarget="scrollableDiv"
                >
                    {
                        products.length !== 0 ? <div className={`${styles.product_list_container}`}>
                            {
                                products.map((product, index: number) => (
                                    <ProductCard key={index} product={product} handleAddToCart={handleAddToCart} disabledCart={!product?.inventory || product?.inventory === 0} />
                                ))
                            }
                        </div> : (loading === true ? <div className={`${styles.product_list_container}`}>
                            {
                                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((_, index: number) => (
                                    <ProductCard key={index} product={null} showSkeleton={true} />
                                ))
                            }
                        </div> : <div className="d-flex align-items-center justify-content-center w-100 border" style={{ height: 200 }}>
                            <h3>No Products Found</h3>
                        </div>)
                    }

                </InfiniteScroll>
            </div>
        </div>
    );
};

export default ProductCardLayout;
