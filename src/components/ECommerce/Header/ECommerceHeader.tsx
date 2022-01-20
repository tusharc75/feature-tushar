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
import { ORDER_TYPES } from '../../../constants/helpers';
import useQuery from '../../../hooks/useQuery';

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
        state: { cartItems },
        dispatch
    }: any = useData();
    const toastConfig = useContext(CustomToastContext);

    const [search, setSearch] = useState("")
    const [open, setOpen] = useState(false);

    const searchText = useDebounce(search, 500)

    const classes = useStyles();
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
    const [searchItems, setSearchItems] = useState([]);

    const [loading, setLoading] = useState(false)

    const { wishlistState, wishlistDispatch } = useContext(WishlistContext);

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const [moreAnchorEl, setMoreAnchorEl] = React.useState(null);

    let query = useQuery();

    let { orderType: orderTypeFromUrl } = useParams();
    const orderTypeInLowerCase = orderTypeFromUrl?.toLowerCase();

    const [orderType, setOrderType] = useState(() => {
        if (orderTypeFromUrl) {
            return ORDER_TYPES.rent.value;
        }
        return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : ORDER_TYPES.rent.value;
    });

    const getOrderType = () => {
        if (orderTypeFromUrl) {
            return Object.keys(ORDER_TYPES).some(s => s.toLowerCase() === orderTypeInLowerCase) && ORDER_TYPES[orderTypeInLowerCase] ? ORDER_TYPES[orderTypeInLowerCase].value : ORDER_TYPES.rent.value;
        }
        return ORDER_TYPES.rent.value;
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

                    <Link to={`${routes.eCommerce.path}/Rent`}>
                        <img className={classes.logo} src={SVG('LogoPng')} alt="equip logo" title="eQuipt Logo" />
                    </Link>

                    <div className="d-flex align-items-center gap-2 mx-3">
                        <Button className={orderType === ORDER_TYPES.sale.value ? "border-bottom" : ""} style={{ color: "white" }}
                            onClick={() => {
                                setOrderType(ORDER_TYPES.sale.value);
                                let queryString = [];

                                queryString.push(`orderType=Sale`)

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
                        >Buy</Button>
                        <Button className={orderType === ORDER_TYPES.rent.value ? "border-bottom" : ""} style={{ color: "white" }}
                            onClick={() => {
                                setOrderType(ORDER_TYPES.rent.value);
                                let queryString = [];

                                queryString.push(`orderType=Rent`)

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
                        >Rent</Button>
                    </div>

                    <ClickAwayListener onClickAway={() => {
                        setOpen(false);
                    }}>
                        <div className={`${classes.search} position-relative`}>
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

                        </div>
                    </ClickAwayListener>

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
        </div>
    );
}
