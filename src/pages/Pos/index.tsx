import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Badge, Box, Button, capitalize, Chip, ClickAwayListener, Divider, Grid, IconButton, InputBase, List, ListItem, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
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
import styles2 from '../Leads/Header.module.scss';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { makeStyles } from '@material-ui/core';
import { MdBorderAll, MdList, MdShoppingCart } from 'react-icons/md';
import { camelCase, filter } from 'lodash';
import Scan from 'src/components/Scan';
import CartDialog from './CartDialog';
import ProductGridLayout from './ProductGridLayout';
import ProductCardLayout from './ProductCardLayout';


const Pos = () => {

    const history = useHistory();
    const renderedFrom = camelCase(routes?.pos.title);

    const toastConfig = useContext(CustomToastContext);
    const [searchVal, setSearchVal] = useState('')
    const [plantOptions, setPlantOptions] = useState([])
    const [plantId, setPlantId] = useState(null);
    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();
    const [products, setProducts] = useState([]);
    const [hasMore, setHasMore] = useState(false)
    const [scanDialog, setScanDialog] = useState(false)
    const [cartDialog, setCartDialog] = useState(false)

    const [filter, setFilter] = useState("grid");

    const handleFilter = (event, newFilter) => {
        if (newFilter != null) {
            setFilter(newFilter);
        }
    };


    useEffect(() => {
        getPlants()
    }, [])

    const getPlants = () => {
        let api = (user?.user?.customerAccountId || user?.user?.customerContactId) ? `${routes.warehouse.path}/customer-account` : `/warehouse?noEntityWise=1`
        axiosInstance()
            .get(api)
            .then(({ data: { data } }) => {
                let row;
                row = data.map(d => ({
                    "warehouseId": d.warehouse || d._id,
                    "warehouseName": d.warehouseName,
                }))

                plantId === null && setPlantId(row[0].warehouseId)
                setPlantOptions(row);
            });
    }








    const handleAddToCart = (product) => {
        let tempProductArray = product.map(d => ({
            "product": d._id,
            "qty": d?.qty ? parseInt(d.qty) : 1,
        }))
        axiosInstance().post(`/pos/cart`, tempProductArray)
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
            }).catch((error) => {
                toastConfig.setToastConfig(error)
            });
    };

    return (
        <Fragment>
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
                            className="showIconLayout"
                        >
                            <Badge badgeContent={1} color="secondary">
                                <MdShoppingCart style={{ color: "white" }} />
                            </Badge>
                        </IconButton>
                        <Box mx={1} />
                    </Box>
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
                            <Box display="flex" alignItems="center">
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
                                    <ToggleButton value={'card'} key={1}>
                                        <MdBorderAll fontSize="small" color="primary" />
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                        </Grid>
                    </Grid>
                </div>

                {filter === 'grid' && (
                    <ProductGridLayout renderedFrom={renderedFrom} handleAddToCart={handleAddToCart} plantId={plantId} searchVal={searchVal} />
                )}
                {filter === 'card' &&
                    <ProductCardLayout handleAddToCart={handleAddToCart} plantId={plantId} searchVal={searchVal} />
                }
                {
                    scanDialog && <Scan onClose={() => setScanDialog(false)} />
                }
                {
                    cartDialog && <CartDialog
                        cartDialogOpen={cartDialog}
                        handleCloseDialog={() => { setCartDialog(false) }}
                    />
                }
            </CustomContainer>

        </Fragment>
    );
};

export default Pos;
