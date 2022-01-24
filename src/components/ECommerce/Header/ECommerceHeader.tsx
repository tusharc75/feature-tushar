import React, { useState, useContext, useEffect, Fragment } from 'react'
import {
    AppBar,
    IconButton,
    Badge,
    Toolbar,
    InputBase,
    MenuItem,
    Menu,
    Chip,
    ClickAwayListener,
    Button
} from '@material-ui/core'
import MenuIcon from '@material-ui/icons/Menu';
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart';
import { Link, useHistory, useParams } from 'react-router-dom'
import { useData } from '../../../StateProvider/Provider';
import { alpha, makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import AccountCircle from '@material-ui/icons/AccountCircle';
import BookmarkIcon from '@material-ui/icons/Bookmark';
import MoreIcon from '@material-ui/icons/MoreVert';
import { SVG } from "../../../assets"
import { WishlistContext } from '../../../StateProvider/WishlistContext/WishlistProvider';
import routes from '../../Helpers/Routes';
import useDebounce from '../../../hooks/useDebounce';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import { isEmpty } from 'lodash';
import { useAccount, useMsal } from '@azure/msal-react';
import { SET_USER, SET_SELECTED_ENTITY } from '../../../StateProvider/actionTypes';
import { capitalize } from 'lodash';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import useQuery from '../../../hooks/useQuery';
import { ECommerceContext } from '../Layout/ECommerceContext/ECommerceContext';
import LocationOnOutlinedIcon from '@material-ui/icons/LocationOnOutlined';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import ManageAddressDialog from '../../Address/ManageAddressDialog';

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
}));

export default function ECommerceHeader() {

    const { instance, accounts } = useMsal();
    const account = useAccount(accounts[0] || {});

    const history = useHistory();
    const {
        state: { user, cartItems },
        dispatch
    }: any = useData();
    const toastConfig = useContext(CustomToastContext);
    const { ORDER_TYPES, firstOrderType } = useContext(ECommerceContext);

    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false);

    const searchText = useDebounce(search, 500)

    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
    const [searchItems, setSearchItems] = useState([]);

    const [loading, setLoading] = useState(false)

    const { wishlistState, wishlistDispatch } = useContext(WishlistContext);

    const [location, setLocation] = useState(() => {
        try {
            if (localStorage.getItem("location")) {
                const locaStorageLocation = JSON.parse(localStorage.getItem("location"));
                return locaStorageLocation.fullAddress;
            }
            return "";
        } catch (ex) {
            console.error("e-commerce header", ex.message)
            return "";
        }
    })

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const [moreAnchorEl, setMoreAnchorEl] = useState(null);
    const [openLocationDialog, setOpenLocationDialog] = useState(false);

    let query = useQuery();

    let { orderType: orderTypeFromUrl } = useParams();
    const orderTypeInLowerCase = orderTypeFromUrl?.toLowerCase();

    const [orderType, setOrderType] = useState(() => {
        if (!orderTypeFromUrl) {
            return firstOrderType?.value;
        }
        return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : firstOrderType?.value;
    });

    const getOrderType = () => {
        if (orderTypeFromUrl) {
            return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : firstOrderType?.value;
        }
        return firstOrderType?.value;
    }

    useEffect(() => {
        setOrderType(getOrderType())
    }, [orderTypeFromUrl])

    useEffect(() => {
        setLoading(true)

        if (searchText) {
            axiosInstance().get(`/ecommerce/search?term=${searchText}`).then(({ data: { data } }) => {
                setSearchItems([...data])
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            }).finally(() => {
                setOpen(true)
                setLoading(false)
            })
        }
        else {
            setSearchItems([]);
            setLoading(false)
        }

    }, [searchText])

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        handleMobileMenuClose();
    };

    const handleClick = (event) => {
        setMoreAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setMoreAnchorEl(null);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMobileMenuOpen = (event) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const logoutUser = async () => {
        try {
            if (!isEmpty(account)) {
                await instance.logoutPopup({
                    account: account
                });
            }
        } catch (e) {
            toastConfig.setToastConfig({
                open: true,
                type: 'error',
                message: 'Need to logout from Azure'
            });
        } finally {
            await axiosInstance()
                .get('/user/logout')
                .then(() => {
                    dispatch({ type: SET_USER, payload: null });
                    dispatch({ type: SET_SELECTED_ENTITY, payload: null });

                    localStorage.clear();

                    wishlistDispatch({ type: "INITIALIZE", payload: [] });
                    history.push('/login');
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
        }
    };

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={menuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            {/* <MenuItem onClick={handleMenuClose}>Profile</MenuItem> */}
            <MenuItem onClick={() => {
                handleMenuClose()
                history.push(`${routes.orders.path}`)
            }}>Orders</MenuItem>
            <MenuItem onClick={logoutUser}>Logout</MenuItem>
        </Menu>
    );

    const mobileMenuId = 'primary-search-account-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem>
                <IconButton color="inherit" onClick={() => {

                }}>
                    <Badge badgeContent={wishlistState.wishlist.length} color="secondary">
                        <BookmarkIcon />
                    </Badge>
                </IconButton>
                <p>Messages</p>
            </MenuItem>
            <MenuItem>
                <IconButton color="inherit" onClick={() => {
                    history.push(`${routes.eCommerceDetail.path}/cart`)
                }}>
                    <Badge badgeContent={cartItems.length} color="secondary">
                        <ShoppingCartIcon />
                    </Badge>
                </IconButton>
                <p>Notifications</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton
                    aria-label="account of current user"
                    aria-controls="primary-search-account-menu"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <AccountCircle />
                </IconButton>
                <p>Profile</p>
            </MenuItem>
        </Menu>
    );

    return (
        <div className={classes.grow}>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        edge="start"
                        className={classes.menuButton}
                        color="inherit"
                        aria-label="open drawer"
                    >
                        <MenuIcon />
                    </IconButton>

                    <Link to={`${routes.eCommerce.path}`}>
                        <img className={classes.logo} src={SVG('LogoPng')} alt="equip logo" title="eQuipt Logo" />
                    </Link>

                    <div className="d-flex align-items-center gap-2 ml-3 mr-2">

                        {
                            Object.keys(ORDER_TYPES).map((key) => (
                                <Button key={key} style={orderType === ORDER_TYPES[key]?.value ? { background: "#40AC99", color: "var(--primary)" } : { color: "white" }}
                                    onClick={() => {
                                        setOrderType(ORDER_TYPES[key]?.value);
                                        let queryString = [];

                                        queryString.push(`orderType=${ORDER_TYPES[key]?.value}`)

                                        if (query.get("category")) {
                                            queryString.push(`category=${query.get("category")}`)
                                        }

                                        if (queryString.length > 0) {
                                            history.push({
                                                pathname: routes.eCommerce.path,
                                                search: `?${queryString.join("&")}`
                                            })
                                        }
                                        else {
                                            history.push(routes.eCommerce.path)
                                        }

                                    }}
                                >{ORDER_TYPES[key]?.key}</Button>
                            ))
                        }

                    </div>

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

                            {
                                loading ? <div className="position-absolute border mt-2 d-flex align-items-center justify-content-center"
                                    style={{ background: "white", zIndex: 10, height: 150, width: 450, boxShadow: "2px 4px 12px 0px #8b8b8b", overflow: "auto", color: "black" }}>
                                    <h4 className="loading-dots">Loading</h4>
                                </div> : (
                                    open && <div className={`position-absolute border mt-2 ${searchItems.length === 0 ? "d-flex align-items-center justify-content-center" : ""}`}
                                        style={{ background: "white", zIndex: 10, height: searchItems.length > 0 ? 500 : 150, width: 450, boxShadow: "2px 4px 12px 0px #8b8b8b", overflow: "auto", color: "black" }}
                                    >

                                        {
                                            searchItems.length > 0 ? <List className={classes.root}>
                                                {
                                                    searchItems.map((m) => (
                                                        <Fragment key={m._id}>
                                                            <ListItem alignItems="flex-start">
                                                                <ListItemText
                                                                    primary={m.name}
                                                                    secondary={
                                                                        <div className="d-flex flex-column gap-2">
                                                                            <Typography
                                                                                component="span"
                                                                                variant="body2"
                                                                                className={classes.inline}
                                                                                color="textPrimary"
                                                                            >
                                                                                {capitalize(m.type)}
                                                                            </Typography>

                                                                            <div className="d-flex gap-3">
                                                                                <Chip className="cursor-pointer" label="Rent" color="primary" title="Rent" onClick={() => {
                                                                                    setSearch("")
                                                                                    setOpen(false)
                                                                                    history.push(`${routes.eCommerceDetail.path}/${m._id}/Rent`)
                                                                                }} />
                                                                                <Chip className="cursor-pointer" label="Buy" color="primary" title="Buy" onClick={() => {
                                                                                    setSearch("")
                                                                                    setOpen(false)
                                                                                    history.push(`${routes.eCommerceDetail.path}/${m._id}/Sale`)
                                                                                }} />
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                />
                                                            </ListItem>
                                                            <Divider />
                                                        </Fragment>
                                                    ))
                                                }
                                            </List> : <h4>No Products Found...</h4>
                                        }
                                    </div>
                                )
                            }

                          <div className="cursor-pointer d-flex gap-2 px-2 align-items-center"
                        onClick={() => {
                            setOpenLocationDialog(true)
                        }}
                        style={{ width: "200px", border: "1px solid white", fontSize: "0.7rem", borderRadius: "5px" , color:"Var(--primary)" }}
                       >
                        <LocationOnOutlinedIcon />
                        <div className="d-flex flex-column">
                            <div>Deliver to {user?.user?.firstName}</div>
                            <div>
                                <b className="text-truncate">{location ? location : "Select Address"}</b>
                            </div>
                        </div>
                    </div>

                        </div>
                    </ClickAwayListener>


                    <div style={{width:"100px" , display:"flex" , alignItems:"center" , padding:"5px 0" }}>
                    <img src="data:image/png;base64,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" alt=""  style={{width:"100%" , height:"auto" , borderRadius:"2px"}}/>
                    </div>
                      

                    <Button className="text-white mx-4" style={{ width: 150 }} endIcon={<ExpandMoreIcon />} aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                        Menu
                    </Button>
                    <Menu
                        id="simple-menu"
                        anchorEl={moreAnchorEl}
                        keepMounted
                        open={Boolean(moreAnchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Menu 1</MenuItem>
                        <MenuItem onClick={handleClose}>Menu 2</MenuItem>
                        <MenuItem onClick={handleClose}>Menu 3</MenuItem>
                    </Menu>

                    <div className={classes.grow} />
                    <div className={classes.sectionDesktop}>
                        <IconButton color="inherit" onClick={() => {

                        }}>
                            <Badge badgeContent={wishlistState.wishlist.length} color="secondary">
                                <BookmarkIcon />
                            </Badge>
                        </IconButton>
                        <IconButton color="inherit" onClick={() => {
                            history.push(`${routes.eCommerceDetail.path}/cart`)
                        }}>
                            <Badge badgeContent={cartItems.length} color="secondary">
                                <ShoppingCartIcon />
                            </Badge>
                        </IconButton>
                        <IconButton
                            edge="end"
                            aria-label="account of current user"
                            aria-controls={menuId}
                            aria-haspopup="true"
                            onClick={handleProfileMenuOpen}
                            color="inherit"
                        >
                            <AccountCircle />
                        </IconButton>
                    </div>
                    <div className={classes.sectionMobile}>
                        <IconButton
                            aria-label="show more"
                            aria-controls={mobileMenuId}
                            aria-haspopup="true"
                            onClick={handleMobileMenuOpen}
                            color="inherit"
                        >
                            <MoreIcon />
                        </IconButton>
                    </div>
                </Toolbar>
            </AppBar>
            {renderMobileMenu}
            {renderMenu}

            {
                openLocationDialog && <ManageAddressDialog
                    title="Search Location"
                    onClose={() => {
                        setOpenLocationDialog(false);
                    }}
                    onSuccess={(obj) => {
                        if (obj) {
                            setOpenLocationDialog(false);
                            localStorage.setItem("location", JSON.stringify(obj));
                            setLocation(obj.fullAddress);
                        }
                    }}
                />
            }
        </div>
    );
}
