import React, { Fragment, useContext, useEffect, useRef, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Formik, Form } from "formik";
import { dateTimeFormat, getObjKeys, getObjKeysWithValues, workOrder } from 'src/constants/helpers';
import { Box, Divider, Grid, IconButton, Paper } from '@material-ui/core';
import FormTypes from 'src/components/ServiceMaster/FormTypes';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { isMobile } from 'react-device-detect';
import moment from 'moment';
import { yupSchemaServiceMaster } from 'src/components/ServiceMaster/Helpers';
import routes from 'src/components/Helpers/Routes';
import Steps from './Steps';


const Service = ({ workOrderId }) => {

    const toastConfig = useContext(CustomToastContext);
    const [serviceSteps, setServiceSteps] = useState([]);
    const [serviceId, setServiceId] = useState(null);
    const [serviceData, setServiceData] = useState([]);

    useEffect(() => {
        fetchWorkOrderService();
        getServiceData()
    }, []);

    const fetchWorkOrderService = () => {
        axiosInstance().get(`${routes.workOrder.path}/service/${workOrderId}`).then(({ data: { data } }) => {
            setServiceSteps(data)
            if (data?.length) {
                setServiceId(data[0]._id)
            }
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        });
    };

    const getServiceData = () => {
        axiosInstance()
            .get(`${workOrder.api}/${workOrderId}/steps-data`)
            .then(({ data: { data } }) => {
                setServiceData(data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    }

    return (<Box p={2}>
        <Grid container>
            <Grid item xs={3}>
                <Box>
                    {serviceSteps?.map((data) => (
                        <Box
                            style={serviceId == data?._id ? { backgroundColor: "#329592", color: "white", cursor: "pointer" } : { cursor: "pointer" }}
                            border={1}
                            p={2} mb={2}
                            borderColor="grey.300"
                            onClick={() => { setServiceId(data?._id) }}>
                            <Typography>{data?.serviceName}</Typography>
                        </Box>
                    ))}
                </Box>
            </Grid>
            <Grid item xs={9}>
                <Box border={1} ml={2} borderColor="grey.300">
                    {serviceId &&
                        <Steps
                            workOrderId={workOrderId}
                            serviceId={serviceId}
                            getServiceData={getServiceData}
                            serviceData={serviceData}
                            serviceSteps={serviceSteps}
                            setServiceId={setServiceId}
                        />}
                </Box>
            </Grid>
        </Grid>
    </Box >);
}
export default Service;