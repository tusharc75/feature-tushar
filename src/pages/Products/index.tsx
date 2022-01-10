import { Paper, Grid, makeStyles } from '@material-ui/core';
import { ToggleButton, ToggleButtonGroup, TreeItem, TreeView } from '@material-ui/lab';
import React, { useEffect, useState, useContext, Fragment, useCallback } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import routes from '../../components/Helpers/Routes';
import ProductCard from '../../components/ProductList/ProductCard/ProductCard';
import { eProduct } from '../../constants/helpers';
import { SET_CART } from '../../StateProvider/actionTypes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import styles from './product-detail-page.module.scss'

const ORDER_TYPES = [
    {
        key: 'Rent',
        value: "rent"
    },
    {
        key: 'Sale',
        value: "sale"
    }
];

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
    }
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
    const [selectedOrderType, setSelectedOrderType] = useState(ORDER_TYPES[0].value)

    const handleSelect = (event, nodeId) => {
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

    // const fetchData = (categoryId, page, orderType = selectedOrderType) => {
    //     setLoading(true);

    //     if (categoryId) {
    //         axiosInstance().get(`${eProduct.api}?page=${page}&limit=${limit}&orderType=${orderType}&deepFilter=[{"field":"productCategory","term":"${categoryId}"}]&filterType=and`).then(({ data: { data, count } }) => {
    //             setTotalCount(count);
    //             setProducts(prevState => [...prevState, ...data]);
    //         }).catch((error) => {
    //             toastConfig.setToastConfig(error);
    //         }).finally(() => {
    //             setLoading(false);
    //         });
    //     }
    //     else if (page !== 0) {
    //         axiosInstance().get(`${eProduct.api}?page=${page}&limit=${limit}&orderType=${orderType}`).then(({ data: { data, count } }) => {
    //             setTotalCount(count);
    //             setProducts(prevState => [...prevState, ...data]);
    //         }).catch((error) => {
    //             toastConfig.setToastConfig(error);
    //         }).finally(() => {
    //             setLoading(false);
    //         });
    //     } else {
    //         axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${orderType}`).then(({ data: { data, count } }) => {
    //             setTotalCount(count);
    //             setProducts([...data]);
    //         }).catch((error) => {
    //             toastConfig.setToastConfig(error);
    //         }).finally(() => {
    //             setLoading(false);
    //         });
    //     }
    // }

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
        let tempQuantity = 1
        addedCartItems.some(o => {
            if (o.productId === item._id) {
                tempQuantity = tempQuantity + 1
                return true
            }
        })

        axiosInstance()
            .post(`/ecommerce/cart`, {
                products: [{
                    quantity: `${tempQuantity}`,
                    productId: item._id
                }]
            }).then(() => {
                fetchCart()
            })
    }

    const renderTree = (nodes) => (
        <TreeItem key={nodes.id} nodeId={nodes.id} label={nodes.name} >
            {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
        </TreeItem>
    );

    return (
        <>
            <Grid container className="headerbox">
                <CustomBreadCrumbs routes={[{ title: routes.eCommerce.title }]} />
            </Grid>
            <div className="detail-container grid-product-category pr-0">
                <div>
                    <Paper>
                        <div className={styles.sidebar_nav}>

                            <ToggleButtonGroup
                                id="productTypes"
                                size="small"
                                value={selectedOrderType}
                                className="w-100"
                                exclusive
                                onChange={(e, value) => {
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
                                }}
                            >
                                {ORDER_TYPES.map((k: any, index) => {
                                    return (
                                        <ToggleButton className="w-100" value={k.value} key={index}>
                                            {k.key}
                                        </ToggleButton>
                                    );
                                })}
                            </ToggleButtonGroup>

                            <div className="d-flex align-items-center justify-content-space-between my-2 px-1">
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
                            </div>

                            <hr />

                            <TreeView
                                className={classes.root}
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
                            </TreeView>
                        </div>

                    </Paper>
                </div>

                <div className="position-relative">

                    <InfiniteScroll
                        dataLength={totalCount}
                        height="calc(100vh - 115px)"
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
                                        <ProductCard key={index} product={product}
                                            onAddItem={onAddToCartItem} selectedOrderType={selectedOrderType}
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
    )
}
