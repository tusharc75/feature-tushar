import { useState, useEffect, Fragment, useContext } from 'react';
import { Box, Grid, Paper, Typography } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { useData } from '../../../StateProvider/Provider';
import CustomContainer from '../../../components/CustomContainer';
import axiosInstance from "src/axios/axiosInstance";

import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Skeleton from '@material-ui/lab/Skeleton';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import DetailsPage from 'src/components/Shared/DetailsPage';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';


const ProductDetails = () => {

    const toastConfig = useContext(CustomToastContext);
    const { id } = useParams();
    const [productData, setProductData] = useState(null);
    const [productDataFields, setProductDataFields] = useState([]);

    useEffect(() => {
        fetchFields()
        if (id) {
            fetchProductData();
        }
    }, [id]);


    const fetchProductData = () => {
        axiosInstance()
            .get(`/pos/product/${id}`)
            .then(({ data: { data } }) => {
                setProductData(data?.productData)
            })
            .catch((err) => {
            });
    }

    const fetchFields = () => {
        axiosInstance()
            .get('/field?resource=Product')
            .then(({ data }) => {
                setProductDataFields(data.data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
    };

    return (<Fragment>
        <Grid container className="headerbox">
            <CustomBreadCrumbs routes={[routes.pos, { title: productData?.productName }]} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
            <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                <Paper>
                    {!productData ? (
                        <div>
                            <Skeleton variant="text" width="150px" height="40px" />
                            <Box display="flex">
                                <Skeleton
                                    style={{ borderRadius: 6 }}
                                    width="120px"
                                    height="80px"
                                />
                                <Box marginX={1} />
                                <Skeleton
                                    style={{ borderRadius: 6 }}
                                    width="120px"
                                    height="80px"
                                />
                            </Box>
                        </div>
                    ) : (

                        <DetailsPageHeader
                            heading={productData?.productName}
                            mainPoints={null}
                            showHeading={true}
                        >
                        </DetailsPageHeader>
                    )}
                    <Box>
                        {!productData || !productDataFields.length ? (
                            <Grid container spacing={2} style={{ padding: "8px" }}>
                                <CommonSkeleton lenArray={[...Array(7).keys()]} />
                            </Grid>
                        ) : (
                            <>
                                <DetailsPage data={productData} fields={productDataFields} />
                            </>
                        )}
                    </Box>
                </Paper>
            </Grid>
        </Grid>
    </Fragment>
    );
};

export default ProductDetails;
