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

    return (<div>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[{ title: routes.eCommercePolicy.title, path: '' }]} />
            </Grid>
        </Grid>
        <div className="main-container">
            <div className="header-panel">
                <Grid container className={styles.rental_header_layout} spacing={1}>
                    <Grid item xs={6} md={6}>
                        <Grid style={{ display: "flex", justifyContent: "left" }}>
                            <MdDescription size={22} className="headerLogo" />
                            <span className="listingHeader">{routes.eCommercePolicy.title}</span>
                        </Grid>
                    </Grid>
                    <Grid item xs={6} md={6}>
                        <Box display="flex" justifyContent="flex-end" alignItems="center">
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={() => { setOpen(true) }}>
                                Edit
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </div>
            <Divider />
            {fields ?
                <DetailsPage data={details} fields={fields} /> :
                <CommonSkeleton lenArray={[...Array(7).keys()]} />}
        </div>
        {open && <DetailsDialog
            onClose={() => setOpen(false)}
            onSuccess={() => {
                setOpen(false)
                fetchDetails();
            }}
        />}
    </div>
    );
};

export default EcommercePolicy;
