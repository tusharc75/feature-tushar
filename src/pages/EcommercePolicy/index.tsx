import { useContext, useState, useEffect, Fragment } from 'react'
import { Grid, Typography, Box, Divider, Button } from '@material-ui/core';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { MdDescription } from "react-icons/md";
import { Link } from "react-router-dom";
import { camelCase } from 'lodash';
import axiosInstance from "../../axios/axiosInstance";
import DetailsPage from "../../components/Shared/DetailsPage";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import DetailsDialog from './DetailsDialog';

const EcommercePolicy = () => {

    const [details, setDetails] = useState({})
    const [fields, setFields] = useState(null)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchDetails()
        getFields()
    }, [])

    const fetchDetails = () => {
        axiosInstance().get('/e-commerce-policy')
            .then(({ data: { data } }) => {
                setDetails(data)
            }).catch((err) => {
            });
    }

    const getFields = () => {
        axiosInstance()
            .get(`/field?resource=e-Commerce Policy`)
            .then(({ data: { data } }) => {
                setFields(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    };

    return (<Box className="main-container-v1">
        <Box className="headerbox-v1">
            <Box className="nav-v1">
                <CustomBreadCrumbs routes={[{ title: routes.eCommercePolicy.title, path: '' }]} />
            </Box>
            <Box className="controls-v1">
                <Box className="control-buttons-v1">
                    <Button
                        variant="contained"
                        size="small"
                        className={'btn-outline-v1'}
                        onClick={() => { setOpen(true) }}>
                        Edit
                    </Button>
                </Box>
            </Box>
        </Box>
        <Box className={`detail-container-v1`}>
            {fields ?
                <DetailsPage data={details} fields={fields} /> :
                <CommonSkeleton lenArray={[...Array(7).keys()]} />}
        </Box>
        {open && <DetailsDialog
            onClose={() => setOpen(false)}
            onSuccess={() => {
                setOpen(false)
                fetchDetails();
            }}
        />}
    </Box>
    );
};

export default EcommercePolicy;
