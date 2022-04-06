import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, capitalize, Chip, ClickAwayListener, Divider, Grid, IconButton, InputBase, List, ListItem, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { Autocomplete } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import axiosInstance from "src/axios/axiosInstance";
import InfiniteScroll from 'react-infinite-scroll-component';
import ProductCard from '../../components/ProductCard/index'
import styles from './pos-page.module.scss'
import LocationOnOutlinedIcon from '@material-ui/icons/LocationOnOutlined';
import SearchIcon from '@material-ui/icons/Search';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { makeStyles } from '@material-ui/core';


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

    const toastConfig = useContext(CustomToastContext);
    const [plant, setPlant] = useState('')
    const [plantOptions, setPlantOptions] = useState([])
    const [plantId, setPlantId] = useState(null);
    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();
    const limit = 21;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false);
    const [searchItems, setSearchItems] = useState([]);

    useEffect(() => {
        getPlants()
        if (plantId) fetchProducts()
    }, [plant, plantId])

    const getPlants = () => {
        axiosInstance()
            .get(`/warehouse?noEntityWise=1`)
            .then(({ data: { data } }) => {
                plantId === null && setPlantId(data[0]._id)
                setPlantOptions(data);
                plantId === null && setPlant(data[0].warehouseName);
            });
    }
    const fetchProducts = () => {
        setProducts([]);
        setLoading(true);
        let api = `/pos?wareHouse=${plantId}&page=${page}&limit=${limit}`;
        axiosInstance().get(api).then(({ data: { data, count } }) => {
            setProducts([...data]);
            setHasMore(data.length !== count);
            setLoading(false);

        }).catch((error) => {
            toastConfig.setToastConfig(error);
        }).finally(() => {
            setLoading(false);
        });
    }


    const fetchMoreData = () => {
        setTimeout(() => {
            let api = `/pos?wareHouse=${plantId}&page=${page}&limit=${limit}`;
            axiosInstance().get(api).then(({ data: { data, count } }) => {
                setPage(prevState => prevState + 1)
                setProducts(prevState => [...prevState, ...data]);

                if ((products.length + data.length) >= count) {
                    setHasMore(false);
                }

            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setLoading(false);
            });

        }, 500)
    }

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.pos]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <Grid container >
                        <Grid item xs={12} sm={12} md={4} className="d-flex align-items-center gap-1">
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
                        <Grid item xs={12} sm={12} md={8} className="d-flex align-items-center gap-1">
                            <ClickAwayListener onClickAway={() => {
                                setOpen(false);
                            }}>
                                <div className={`${classes.search} position-relative d-flex`}>
                                    <div className={classes.searchIcon}>
                                        <SearchIcon />
                                    </div>
                                    <InputBase
                                        value={search}
                                        placeholder="Search..."
                                        onChange={(e) => {
                                            setSearch(e.target.value)
                                        }}
                                        classes={{
                                            root: classes.inputRoot,
                                            input: classes.inputInput,
                                        }}
                                        inputProps={{ 'aria-label': 'search' }}
                                    />
                                    <IconButton
                                        onClick={() => {
                                        }}
                                        size="small"
                                        className="mr-2"
                                        edge="start"
                                        color="inherit"
                                        aria-label="open drawer"
                                    >
                                        <CropFreeIcon style={{ color: "black" }} />
                                    </IconButton>
                                </div>
                            </ClickAwayListener>
                        </Grid>
                    </Grid>
                </div>
                <Box p={1}>
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

                    </InfiniteScroll>
                </Box>
            </CustomContainer>
        </Fragment>
    );
};

export default Pos;
