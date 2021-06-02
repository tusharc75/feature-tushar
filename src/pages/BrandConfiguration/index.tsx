import React, { useContext, useState, useEffect } from 'react'
import axiosInstance from "../../axios/axiosInstance";
import Layout from "../../components/Layout";
import routes from "../../components/Helpers/Routes";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import DetailsPage from "../../components/Shared/DetailsPage";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { Grid, Box, Paper, Button, Divider, Typography } from '@material-ui/core'
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import { useData } from "../../StateProvider/Provider";
import { userType } from '../../constants/helpers'

export default function BrandConfiguration(props) {
    const [brandDetails, setBrandDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isUpdating, setUpdating] = useState(false)
    const [brandFields, setBrandFields] = useState([])
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, permissions },
    }: any = useData();

    useEffect(() => {
        if (user?.user?.userType === userType.brandAdmin) fetchBrandDetails()
    }, [])
    const fetchBrandDetails = () => {
        setLoading(true)
        axiosInstance().get('/brand')
            .then(({ data: { data } }) => {
                setBrandDetails(data)
                if (data?._id && brandFields.length === 0) {
                    getBrandFields(data._id)
                }
                else setLoading(false);
            }).catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }
    const getBrandFields = (id) => {
        axiosInstance()
            .get(`/sa-field?brand=${id}&resource=Brand`)
            .then(({ data: { data } }) => {
                setBrandFields(data);
                setLoading(false);
            })
            .catch((err) => {
                setLoading(false);
            });
    };

    const handleOpenUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDIalog = () => {
        setOpenUpdateDialog(false);
    };

    const handleUpdate = (values) => {
        setUpdating(true)
        axiosInstance()
            .put('/brand', { ...values })
            .then(({ data }) => {
                setUpdating(false)
                toastConfig.setToastConfig({
                    open: true,
                    type: "success",
                    message: data.message,
                });
                fetchBrandDetails()
                closeUpdateDIalog()
            })
            .catch((error) => {
                setUpdating(false)
                toastConfig.setToastConfig(error);
            });
    }
    return <>
        {
            openUpdateDialog && (
                <UpdateDetailsDialog
                    title="Update Brand"
                    openDialog={openUpdateDialog}
                    onClose={closeUpdateDIalog}
                    data={brandDetails}
                    fields={brandFields}
                    isUpdating={isUpdating}
                    handleUpdate={handleUpdate}
                />
            )
        }
        <Layout>
            <Grid container className="headerbox">
                <CustomBreadCrumbs routes={[routes.brandConfiguration]} />
            </Grid>
            <Grid container spacing={1} className="detail-container">
                <Grid item xs={12} sm={12} lg={12} >
                    <Paper>
                        {
                            user?.user?.userType === userType.brandAdmin ?
                                loading || !brandFields.length || !brandDetails ? (
                                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                                ) : (<>
                                    <div style={{ padding: '13px 10px', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography
                                            className="text-capitalize"
                                            style={{ display: "inline-block" }}
                                            variant="h6"
                                            component="h2"
                                            color="primary"
                                        >
                                            <span className="d-flex align-items-center gap-2"><span className="listingHeader">
                                                {brandDetails?.companyName ?? ""}
                                            </span>
                                            </span></Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small" 
                                            onClick={handleOpenUpdateDialog}>Edit</Button>
                                    </div>
                                    <Divider />
                                    <DetailsPage data={brandDetails} fields={brandFields} />
                                </>
                                ) : <Paper style={{ minHeight: '300px', textAlign: 'center' }}> <Typography
                                    className="text-capitalize"
                                    style={{ display: "inline-block" }}
                                    variant="h6"
                                    component="h2"
                                    color="primary">You don't have permission</Typography>
                                </Paper>
                        }
                    </Paper>
                </Grid>
            </Grid>
        </Layout>
    </>
}