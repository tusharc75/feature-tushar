import { Grid, makeStyles } from '@material-ui/core';
import { TreeItem, TreeView } from '@material-ui/lab';
import { useEffect, useState, useContext, useMemo } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component';
import axiosInstance from '../../../axios/axiosInstance';
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
import { useLocation, useHistory } from 'react-router-dom';
import ECommerceBreadCrumbs from '../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs';
import useQuery from '../../../hooks/useQuery';

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
    const history = useHistory();

    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false)

    const [addedCartItems, setAddedCartItems] = useState([])
    const [selectedCategory, setSelectedCategory] = useState({ id: null, name: "" });

    const { dispatch }: any = useData();

    const classes = useStyles();
    const [productCategories, setProductCategories] = useState({ flatDataSource: [], treeDataSource: [] });
    const [selected, setSelected] = useState([]);

    // const [selectedOrderType, setSelectedOrderType] = useState(orderType ?? ORDER_TYPES.rent.value)

    let query = useQuery();
    const orderTypeFromUrl = query.get("orderType")
    const category = query.get("category")

    const orderTypeInLowerCase = orderTypeFromUrl?.toLowerCase();
    // const [selectedOrderType, setSelectedOrderType] = useState(() => {

    // });

    // useEffect(() => {
    //     if (orderTypeFromUrl) {

    //         if (!orderTypeFromUrl) {
    //             return ORDER_TYPES.rent.value;
    //         }
    //         return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : ORDER_TYPES.rent.value;

    //     }
    // }, [orderTypeFromUrl]);

    // useEffect(() => {
    //     setSelectedCategory({ id: null, name: category });
    // }, [category])

    useEffect(() => {
        axiosInstance()
            .get(`/product-category?limit=0`)
            .then(({ data: { data } }) => {

                // setSelectedCategoryNameDataSource([...data])

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

                setProductCategories({ flatDataSource: [...data], treeDataSource: [...allCategories] })

            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }, [])

    useEffect(() => {

        if (category) {
            const categoryId = productCategories.flatDataSource.find(f => f._id === category)?._id;

            if (categoryId) {
                handleSelect(null, categoryId);
            } else {
                fetchProducts()
            }
        } else {
            fetchProducts();
        }

    }, [query.get("orderType"), productCategories.flatDataSource, productCategories.treeDataSource])

    const fetchProducts = () => {
        setProducts([]);
        setTotalCount(0);

        setLoading(true);

        let queryString = "";

        if (getOrderType()) {
            queryString = `${queryString}&orderType=${getOrderType()}`
        }
        if (query.get("category")) {
            queryString = `${queryString}&category=${category}`
        }

        axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&${queryString}`).then(({ data: { data, count } }) => {
            setTotalCount(count);
            setProducts([...data]);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        }).finally(() => {
            setLoading(false);
        });

        fetchCart();
    }

    const getOrderType = () => {

        if (orderTypeFromUrl) {
            return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : ORDER_TYPES.rent.value;
        }

        return ORDER_TYPES.rent.value;
    }

    const handleSelect = (_, nodeId) => {
        if (selected.length === 0 || (selected.length !== 0 && selected[0] !== nodeId)) {
            setProducts([]);
            setTotalCount(0);

            const selectedCategory = productCategories.flatDataSource.find(o => o._id === nodeId);

            let queryString = [];

            if (query.get("orderType")) {
                queryString.push(`orderType=${query.get("orderType")}`)
            }
            queryString.push(`category=${nodeId}`)

            if (queryString.length > 0) {
                history.push({
                    pathname: history.location.pathname,
                    search: `?${queryString.join("&")}`
                })
            }
            else {
                history.push(history.location.pathname)
            }

            setSelected([nodeId]);
            setSelectedCategory({ id: nodeId, name: selectedCategory.name });

            setLoading(true);

            axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${getOrderType()}&deepFilter=[{"field":"productCategory","term":"${selectedCategory.name}"}]&filterType=and`).then(({ data: { data, count } }) => {
                setTotalCount(count);
                setProducts([...data]);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });
        } else {
            fetchProducts();
        }
    }

    const fetchCart = () => {
        axiosInstance()
            .get(`/ecommerce/cart`).then(({ data: { data } }) => {

                if (data) {
                    dispatch({ type: SET_CART, payload: [...data] });
                    setAddedCartItems(data)
                }
            })
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

                            <div className="d-flex align-items-center justify-content-space-between my-2 px-1">
                                <h3>Categories</h3>
                                {
                                    selected && selected.length !== 0 ? <span className="link cursor-pointer" onClick={() => {
                                        setSelected([]);
                                        setProducts([]);
                                        setTotalCount(0);

                                        setSelectedCategory({ id: null, name: "" });

                                        setLoading(true);

                                        if (query.get("orderType")) {
                                            history.push(`${routes.eCommerce.path}?orderType=${query.get("orderType")}`)
                                        } else {
                                            history.push(routes.eCommerce.path)
                                        }

                                        axiosInstance().get(`${eProduct.api}?page=0&limit=${limit}&orderType=${getOrderType()}`).then(({ data: { data, count } }) => {
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
                                className={`${classes.root} d-flex flex-column gap-1`}
                                selected={selected}
                                onNodeSelect={handleSelect}
                                defaultCollapseIcon={<ExpandMoreIcon />}
                                defaultExpanded={['root']}
                                defaultExpandIcon={<ChevronRightIcon />}
                            >
                                {
                                    productCategories.treeDataSource.map(obj => {
                                        return renderTree(obj)
                                    })
                                }
                            </TreeView>
                            <Filters
                                setToastConfig={toastConfig.setToastConfig}
                            />
                        </div>

                    </Grid>

                    <Grid item xs={9} className="px-2">

                        <div className="p-2">
                            <ECommerceBreadCrumbs routes={selectedCategory.id ? [{ title: selectedCategory.name }] : []} />
                        </div>

                        <div className="position-relative">

                            <InfiniteScroll
                                dataLength={totalCount}
                                next={() => {
                                    setTimeout(() => {
                                        // fetchData(null, page + 1, selectedOrderType)
                                        setPage(prevState => prevState + 1)

                                        let url = `${eProduct.api}?page=${page + 1}&limit=${limit}&orderType=${getOrderType()}`;
                                        if (selectedCategory.id) {
                                            url = `${url}&deepFilter=[{"field":"productCategory","term":"${selectedCategory.name}"}]&filterType=and`
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
                                                <ProductCard key={index} product={product} selectedOrderType={getOrderType()} />
                                            ))
                                        }
                                    </div> : <div className={`${styles.product_list_container}`}>
                                        {
                                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((_, index: number) => (
                                                <ProductCard key={index} product={null} showSkeleton={true} selectedOrderType={getOrderType()} />
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
