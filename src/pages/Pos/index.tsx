import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, capitalize, Chip, ClickAwayListener, Divider, Grid, IconButton, InputBase, List, ListItem, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { Autocomplete, ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import axiosInstance from "src/axios/axiosInstance";
import InfiniteScroll from 'react-infinite-scroll-component';
import ProductCard from '../../components/ProductCard/index'
import styles from './pos-page.module.scss'
import styles2 from '../Leads/Header.module.scss';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { makeStyles } from '@material-ui/core';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid } from 'src/constants/helpers';
import { CommonRenderer, ImageRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import { MdAddShoppingCart, MdBorderAll, MdList } from 'react-icons/md';
import { camelCase, filter } from 'lodash';
import Scan from 'src/components/Scan';


const useStyles = makeStyles((theme) => ({
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        border: '1px solid lightgrey',
        backgroundColor: "white",
        '&:hover': {
            backgroundColor: "white",
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(3),
            // width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.primary.main
    },
    inputRoot: {
        // color: 'inherit',
        width: "100%"
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        // [theme.breakpoints.up('md')]: {
        //     width: '20ch',
        // },
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    logo: {
        width: '140px'
    },
    root: {
        width: '100%',
        // maxWidth: '36ch',
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        display: 'inline',
    },
    brandLogo: {
        maxWidth: '10%',
        height: '45px',
        borderRadius: '4px',
        marginRight: '5px'
    },
}));

const Pos = () => {

    const history = useHistory();
    const classes = useStyles();
    const renderedFrom = camelCase(routes?.pos.title);

    const toastConfig = useContext(CustomToastContext);
    const [plant, setPlant] = useState('')
    const [plantOptions, setPlantOptions] = useState([])
    const [plantId, setPlantId] = useState(null);
    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();
    const [products, setProducts] = useState([]);
    const [hasMore, setHasMore] = useState(false)
    const [scanDialog, setScanDialog] = useState(false)
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;

    const columns = [
        { field: "productName", headerName: "Product Name", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productImage", headerName: "Product Image", show: true, disabled: true, cellRenderer: "imageRenderer" },
        { field: "productDesc", headerName: "Product Description", show: true, disabled: true, cellRenderer: "commonRenderer" },
        { field: "productNumber", headerName: "Product Number", show: true, disabled: true, cellRenderer: "commonRenderer" },
    ]

    const [filter, setFilter] = useState("grid");

    const handleFilter = (event, newFilter) => {
        if (newFilter != null) {
            setFilter(newFilter);
        }
    };

    const ActionsRenderer = (params) => (
        <Fragment>
            <Tooltip
                title={'Add to cart'}
            >
                <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                    }}
                >
                    <MdAddShoppingCart fontSize="small" color="primary" />
                </IconButton>
            </Tooltip>
        </Fragment>
    );
    const frameWorkComponent = {
        commonRenderer: CommonRenderer,
        imageRenderer: ImageRenderer,
        actionsRenderer: ActionsRenderer
    };

    useEffect(() => {
        if (plantId) fetchProducts();
    }, [page, limit, filters, sorting, search, plant, plantId]);

    useEffect(() => {
        getPlants()
    }, [])

    const getPlants = () => {
        axiosInstance()
            .get(`/warehouse?noEntityWise=1`)
            .then(({ data: { data } }) => {
                plantId === null && setPlantId(data[0]._id)
                setPlantOptions(data);
                plantId === null && setPlant(data[0].warehouseName);
            });
    }

    const getQueryString = () => {
        let deepFilter = `&page=${page}&limit=${limit}`;

        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];

            Object.keys(filters).forEach((field) => {
                updatedFilters.push({
                    field: field,
                    term: filters[field].filter
                });
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
        }

        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
        }

        if (search) {
            deepFilter = `${deepFilter}&search=${search}`;
        }
        return deepFilter;
    };

    const fetchProducts = () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }
        let api = `/pos?wareHouse=${plantId}${queryString}`;
        axiosInstance().get(api).then(({ data: { data, count } }) => {
            setProducts((prevState) => {
                if (search) {
                    return [...data];
                }
                return [...prevState, ...data];
            });
            setHasMore(data.length !== count);
            let rows = data.map((u) => {
                let finalObject = prepareDataForGrid(u);
                return {
                    ...finalObject
                };
            });
            dispatch({ type: 'initialize', data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        }).catch((error) => {
            toastConfig.setToastConfig(error);
            dispatch({ type: 'loading', loading: false });
        })
    }


    const fetchMoreData = () => {
        setTimeout(() => {
            let api = `/pos?wareHouse=${plantId}&page=${page}&limit=${limit}`;
            axiosInstance().get(api).then(({ data: { data, count } }) => {
                // setPage(prevState => prevState + 1)
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

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.pos]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container className={styles2.filter_side_container}>
                        <Grid item xs={12} md={6} sm={12} className={isMobile ? styles2.mobile_panel : 'd-flex align-items-center gap-1'}>
                            <Autocomplete
                                style={{ width: "250px" }}
                                options={plantOptions}
                                getOptionLabel={(option: any) => option.warehouseName}
                                disableClearable
                                getOptionSelected={(option: any, val) =>
                                    option._id === val
                                }
                                value={plantOptions.filter((data) => data._id === plantId).length
                                    ? plantOptions.filter((data) => data._id === plantId)[0]
                                    : ""
                                }
                                onChange={(e, val) => {
                                    if (val !== null) {
                                        setPlantId(val && val._id ? val._id : "")
                                    }
                                }}
                                renderInput={(params) => (
                                    isMobile && !isTablet ?
                                        <TextField
                                            {...params}
                                            margin="dense"
                                            name="plant"
                                            placeholder="Plant"
                                            variant="standard"
                                            fullWidth
                                            className={isMobile ? "serchBox" : ""}
                                        /> :
                                        <TextField
                                            {...params}
                                            margin="dense"
                                            name="plant"
                                            label="Plant"
                                            variant="outlined"
                                            fullWidth
                                        />
                                )}
                            />
                        </Grid>

                        <Grid md={6} sm={12} xs={12} container className={styles2.filter_side}>
                            <Box className={isMobile ? styles2.mobile_filter_side_header : styles2.filter_side_header} component="div">
                                <SearchBox
                                    onSearch={handleSearch}
                                    searchbox={styles2.search_box_input}
                                    value={search}
                                    size="small"
                                    width="350px"
                                    placeholder="Search Product"
                                    style={isMobile ? { flex: 1 } : {}}
                                />

                                <IconButton
                                    onClick={() => { setScanDialog(true) }}
                                    size="small"
                                    className="mr-2"
                                    edge="start"
                                    color="inherit"
                                    aria-label="open drawer"
                                >
                                    <CropFreeIcon style={{ color: "black" }} />
                                </IconButton>
                            </Box>
                        </Grid>
                    </Grid>
                </div>
                <ToggleButtonGroup
                    size="small"
                    className=" toggle-button-layout"
                    value={filter}
                    exclusive
                    onChange={handleFilter}
                >
                    <ToggleButton value={'grid'} key={0}>
                        <MdList fontSize="small" color="primary" />
                    </ToggleButton>
                    <ToggleButton value={'tile'} key={1}>
                        <MdBorderAll fontSize="small" color="primary" />
                    </ToggleButton>
                </ToggleButtonGroup>
                {Object.keys(frameWorkComponent).length > 0 && filter === 'grid' && (
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        actionWidth={100}
                        loading={loading}
                        renderedFrom={renderedFrom}
                        refreshGrid={fetchProducts}
                        allowSelection={false} />
                )}
                {filter === 'tile' &&
                    <InfiniteScroll
                        dataLength={products.length}
                        next={fetchMoreData}
                        hasMore={hasMore}
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
                                        <ProductCard key={index} product={product} />
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

                    </InfiniteScroll>}
                {
                    scanDialog && <Scan onClose={() => setScanDialog(false)} />
                }
            </CustomContainer>

        </Fragment>
    );
};

export default Pos;
