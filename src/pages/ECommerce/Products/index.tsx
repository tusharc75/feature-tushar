import { Paper, Grid, makeStyles } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup, TreeItem, TreeView } from '@material-ui/lab';
import React, { useEffect, useState, useContext, Fragment, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import axiosInstance from '../../../axios/axiosInstance';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import routes from '../../../components/Helpers/Routes';
import ProductCard from '../../../components/ProductList/ProductCard/ProductCard';
import { eProduct, ORDER_TYPES } from '../../../constants/helpers';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import styles from './product-detail-page.module.scss'
import Filters from '../Filters';

const useStyles = makeStyles((theme) => ({
    root: {
        // width: '100%',
        backgroundColor: theme.palette.background.paper,
        marginBottom: "10px"
    },
    nested: {
        paddingLeft: theme.spacing(4)
    },
    input: {
        marginLeft: theme.spacing(1),
        flex: 1
    },
    iconButton: {
        padding: 10
    },
    flexGrow1: {
        flexGrow: 1,
    },
}));

export default function Products() {

    const limit = 21;
    const toastConfig = useContext(CustomToastContext);

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false)

    const [addedCartItems, setAddedCartItems] = useState([])
    const [selectedCategoryName, setSelectedCategoryName] = useState("");

    const { dispatch }: any = useData();

    const classes = useStyles();
    const [productCategories, setProductCategories] = useState([]);
    const [selected, setSelected] = useState([]);
    const [categoryDataSource, setSelectedCategoryNameDataSource] = useState([]);
    const [selectedOrderType, setSelectedOrderType] = useState(ORDER_TYPES.rent.value)

    const handleSelect = (_, nodeId) => {
        if (selected.length === 0 || (selected.length !== 0 && selected[0] !== nodeId)) {
            const category = categoryDataSource.find(o => o._id === nodeId);

            setSelected([nodeId]);
            setSelectedCategoryName(category.name);

            setLoading(true);

            axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${selectedOrderType}&deepFilter=[{"field":"productCategory","term":"${category.name}"}]&filterType=and`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts([...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });

        }
    }

    useEffect(() => {
        setLoading(true);

        axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${selectedOrderType}`).then(({ data: { data, count } }) => {
            setTotalCount(count);
            setProducts([...data]);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        }).finally(() => {
            setLoading(false);
        });

        fetchCart();

        let queryString = `?limit=0`;

        axiosInstance()
            .get(`/product-category${queryString}`)
            .then(({ data: { data } }) => {

                setSelectedCategoryNameDataSource([...data])
                let parentCategories = {}
                data.map(o => {
                    if (o?.parentCategory) {
                        let label = o?.parentCategory?.optionLabel
                        if (parentCategories[label]) {
                            parentCategories[label].push(o)
                        }
                        else {
                            parentCategories[label] = [o]
                        }
                    }
                })

                data = data.map(obj => {
                    if (parentCategories[obj.name]) {
                        obj.children = parentCategories[obj.name]
                    }
                    else {
                        obj.children = []
                    }
                    return obj
                })

                let allCategories = data.filter(obj => !(obj?.parentCategory))

                setProductCategories(allCategories)
            });
    }, [])

    const fetchCart = () => {
        axiosInstance()
            .get(`/ecommerce/cart`).then(({ data: { data } }) => {

                if (data) {
                    dispatch({ type: SET_CART, payload: [...data] });
                    setAddedCartItems(data)
                }
            })
    }

    const onAddToCartItem = (item) => {
        debugger;

        // let tempQuantity = 1
        // addedCartItems.some(o => {
        //     if (o.productId === item._id) {
        //         tempQuantity = tempQuantity + 1
        //         return true
        //     }
        // })

        // axiosInstance()
        //     .post(`/ecommerce/cart`, {
        //         products: [{
        //             quantity: `${tempQuantity}`,
        //             productId: item._id
        //         }]
        //     }).then(() => {
        //         fetchCart()
        //     })
    }

    const renderTree = (nodes) => (
        <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name}>
            {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
        </TreeItem>
    );

    return (
        <>
            <div className={classes.flexGrow1}>
                <Grid container className="mt-2">

                    <Grid item xs={3} className="border">

                        <div className={styles.sidebar_nav}>

                            <ToggleButtonGroup
                                id="productTypes"
                                size="small"
                                value={selectedOrderType}
                                className="w-100"
                                exclusive
                                onChange={(e, value) => {
                                    if (value) {
                                        setProducts([]);
                                        setTotalCount(0);

                                        setSelectedOrderType(value)
                                        setLoading(true);

                                        axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${value}`).then(({ data: { data, count } }) => {
                                            setTotalCount(count);
                                            setProducts([...data]);
                                        }).catch((error) => {
                                            toastConfig.setToastConfig(error);
                                        }).finally(() => {
                                            setLoading(false);
                                        });
                                    }
                                }}
                            >
                                {
                                    Object.keys(ORDER_TYPES).map((k: any, index) => {
                                        return (
                                            <ToggleButton className="w-100" value={ORDER_TYPES[k].value} key={index}>
                                                {ORDER_TYPES[k].key}
                                            </ToggleButton>
                                        );
                                    })
                                }
                            </ToggleButtonGroup>

                            {/* <div className="d-flex align-items-center justify-content-space-between my-2 px-1">
                                <h3>Categories</h3>
                                {
                                    selected && selected.length !== 0 ? <span className="link cursor-pointer" onClick={() => {
                                        setSelected([]);
                                        setSelectedCategoryName("");

                                        setLoading(true);

                                        axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${selectedOrderType}`).then(({ data: { data, count } }) => {
                                            setTotalCount(count);
                                            setProducts([...data]);
                                        }).catch((error) => {
                                            toastConfig.setToastConfig(error);
                                        }).finally(() => {
                                            setLoading(false);
                                        });

                                    }}>Clear</span> : <></>
                                }
                            </div> */}

                            {/* <hr />

                            <TreeView
                                className={`${classes.root} d-flex flex-column gap-1`}
                                selected={selected}
                                onNodeSelect={handleSelect}
                                defaultCollapseIcon={<ExpandMoreIcon />}
                                defaultExpanded={['root']}
                                defaultExpandIcon={<ChevronRightIcon />}
                            >
                                {
                                    productCategories.map(obj => {
                                        return renderTree(obj)
                                    })
                                }
                            </TreeView> */}
                            <Filters
                               setToastConfig={toastConfig.setToastConfig}
                               productCategories={productCategories}
                            />
                        </div>

                    </Grid>

                    <Grid item xs={9} className="px-2">

                        <div className="p-2">
                            <CustomBreadCrumbs routes={[{ title: routes.eCommerce.title }]} />
                        </div>

                        <div className="position-relative">

                            <InfiniteScroll
                                dataLength={totalCount}
                                next={() => {
                                    setTimeout(() => {
                                        // fetchData(null, page + 1, selectedOrderType)
                                        setPage(prevState => prevState + 1)

                                        let url = `${eProduct.api}?page=${page + 1}&limit=${limit}&orderType=${selectedOrderType}`;
                                        if (selectedCategoryName) {
                                            url = `${url}&deepFilter=[{"field":"productCategory","term":"${selectedCategoryName}"}]&filterType=and`
                                        }

                                        axiosInstance().get(url).then(({ data: { data, count } }) => {
                                            setTotalCount(count);
                                            setProducts(prevState => [...prevState, ...data]);
                                        }).catch((error) => {
                                            toastConfig.setToastConfig(error);
                                        }).finally(() => {
                                            setLoading(false);
                                        });

                                    }, 1500)
                                }}
                                hasMore={products.length !== totalCount}
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
                                                <ProductCard key={index} product={product} selectedOrderType={selectedOrderType} />
                                            ))
                                        }
                                    </div> : <div className={`${styles.product_list_container}`}>
                                        {
                                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, index: number) => (
                                                <ProductCard key={index} product={null} showSkeleton={true} selectedOrderType={selectedOrderType} />
                                            ))
                                        }
                                    </div>
                                }

                            </InfiniteScroll>
                        </div>

                    </Grid>

                </Grid>
            </div>

        </>
    )
}
