import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Badge, Box, Button, capitalize, Chip, ClickAwayListener, Divider, Grid, IconButton, InputBase, List, ListItem, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
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
import styles2 from '../Leads/Header.module.scss';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { MdBorderAll, MdList, MdShoppingCart } from 'react-icons/md';
import { camelCase, filter } from 'lodash';
import Scan from 'src/components/Scan';
import Cart from './Cart';
import ProductGrid from './Product/Grid';
import ProductCard from './Product/Card';
import ButtonGroup from '@material-ui/core/ButtonGroup';


const Pos = () => {

    const renderedFrom = camelCase(routes?.pos.title);

    const toastConfig = useContext(CustomToastContext);
    const [searchVal, setSearchVal] = useState('')
    const [plantOptions, setPlantOptions] = useState([])
    const [plantId, setPlantId] = useState(null);
    const { state: { user, permissions, selectedEntity } }: any = useData();
    const [scanDialog, setScanDialog] = useState(false)
    const [cartDialog, setCartDialog] = useState(false)
    const [cartProduct, setCartProduct] = useState([])

    const [viewType, setViewType] = useState("grid");

    useEffect(() => {
        getPlants()
        fetchCart()
    }, [])

    const getPlants = () => {
        var api = `/warehouse?noEntityWise=1`;
        if (user?.user?.customerAccountId || user?.user?.customerContactId) {
            api = `${routes.warehouse.path}/customer-contact`;
        }
        axiosInstance().get(api)
            .then(({ data: { data } }) => {
                const row = data.map(d => ({
                    "warehouseId": d.warehouse || d._id,
                    "warehouseName": d.warehouseName,
                }))
                setPlantId(row[0].warehouseId)
                setPlantOptions(row);
            });
    }

    const fetchCart = () => {
        axiosInstance().get(`/pos/cart`)
            .then(({ data: { data } }) => {
                setCartProduct(data)
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }

    const handleAddToCart = (product) => {
        console.log(cartProduct)
        if (product?.length === 1) {
            let data = [{
                "product": product[0]._id,
                "qty": product[0]?.qty ? parseInt(product[0].qty) : 1,
            }]
            axiosInstance().post(`/pos/cart`, data)
                .then(({ data }) => {
                    fetchCart()
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: "Add to cart successfully"
                    });
                }).catch((error) => {
                    toastConfig.setToastConfig(error)
                });
        }
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.pos]} />
            </Grid>
            <Grid item md={8} sm={11} xs={10}>
                <Box display={"flex"} justifyContent="flex-end">
                    <IconButton
                        id="Cart"
                        aria-label="settings"
                        color="inherit"
                        title="Cart"
                        onClick={() => { setCartDialog(true) }}
                    >
                        <Badge badgeContent={cartProduct?.length} color="secondary">
                            <MdShoppingCart style={{ color: "white" }} />
                        </Badge>
                    </IconButton>
                    <Box mx={1} />
                </Box>
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                <Grid container >
                    <Grid item xs={12} md={6} sm={12} className={isMobile ? styles2.mobile_panel : 'd-flex align-items-center gap-1'}>
                        <Autocomplete
                            style={{ width: "250px" }}
                            options={plantOptions}
                            getOptionLabel={(option: any) => option.warehouseName}
                            disableClearable
                            getOptionSelected={(option: any, val) =>
                                option.warehouseId === val
                            }
                            value={plantOptions.filter((data) => data.warehouseId === plantId).length
                                ? plantOptions.filter((data) => data.warehouseId === plantId)[0]
                                : ""
                            }
                            onChange={(e, val) => {
                                if (val !== null) {
                                    setPlantId(val && val.warehouseId ? val.warehouseId : "")
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
                                onSearch={(e) => { setSearchVal(e.target.value) }}
                                searchbox={styles2.search_box_input}
                                value={searchVal}
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
                <Box display={"flex"} justifyContent="flex-end">
                    <ButtonGroup color="primary" aria-label="outlined primary button group">
                        <Button
                            variant={viewType === "grid" ? "contained" : "outlined"}
                            size='small'
                            onClick={() => setViewType("grid")}
                        >
                            <MdList fontSize="small" color="primary" />
                        </Button>
                        <Button
                            size='small'
                            variant={viewType === "card" ? "contained" : "outlined"}
                            onClick={() => setViewType("card")}
                        >
                            <MdBorderAll fontSize="small" color="primary" />
                        </Button>
                    </ButtonGroup>
                </Box>
            </div>
            {viewType === 'grid' ?
                <ProductGrid
                    renderedFrom={renderedFrom}
                    handleAddToCart={handleAddToCart}
                    plantId={plantId}
                    searchVal={searchVal} />
                :
                <ProductCard
                    handleAddToCart={handleAddToCart}
                    plantId={plantId}
                    searchVal={searchVal} />
            }
            {scanDialog &&
                <Scan onClose={() => setScanDialog(false)} />
            }
            {cartDialog &&
                <Cart
                    fetchCart={fetchCart}
                    products={cartProduct}
                    handleCloseDialog={() => { setCartDialog(false) }}
                />
            }
        </CustomContainer>
    </Fragment>
    );
};

export default Pos;
