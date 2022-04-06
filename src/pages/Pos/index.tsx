import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Box, Button, Grid, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';



const Pos = () => {

    const history = useHistory();
    const toastConfig = useContext(CustomToastContext);

    const {
        state: { user, permissions, selectedEntity }
    }: any = useData();






    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.pos]} />
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                </div>
            </CustomContainer>
        </Fragment>
    );
};

export default Pos;
