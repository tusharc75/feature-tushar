import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const FieldTicket = ({ selectedFieldService }) => {

    const toastConfig = useContext(CustomToastContext);
    const { state: { permissions, selectedEntity, user } }: any = useData();

    return (
        <Box className="main-container-v1">

        </Box>
    );
};

export default FieldTicket;
