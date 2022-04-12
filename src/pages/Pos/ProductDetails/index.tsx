import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Badge, Box, Button, capitalize, Chip, ClickAwayListener, Divider, Grid, IconButton, InputBase, List, ListItem, ListItemText, Menu, MenuItem, TextField, Tooltip, Typography } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { useData } from '../../../StateProvider/Provider';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../../components/CustomContainer';
import { Autocomplete } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import SearchBox from 'src/components/Helpers/SearchBox';
import axiosInstance from "src/axios/axiosInstance";
import styles2 from '../Leads/Header.module.scss';
import CropFreeIcon from '@material-ui/icons/CropFree';
import { MdBorderAll, MdList, MdShoppingCart } from 'react-icons/md';
import { camelCase, filter } from 'lodash';
import ButtonGroup from '@material-ui/core/ButtonGroup';


const ProductDetails = () => {


    const { state: { user, permissions, selectedEntity } }: any = useData();

    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.pos, "Product"]} />
            </Grid>
            <Grid item md={8} sm={11} xs={10}>
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">

            </div>
        </CustomContainer>
    </Fragment>
    );
};

export default ProductDetails;
