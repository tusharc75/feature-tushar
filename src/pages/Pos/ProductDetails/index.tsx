import { useState, useEffect, Fragment } from 'react';
import { Box, Grid } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import { useData } from '../../../StateProvider/Provider';
import CustomContainer from '../../../components/CustomContainer';
import axiosInstance from "src/axios/axiosInstance";

import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';


const ProductDetails = () => {

    const { state: { user, permissions, selectedEntity } }: any = useData();
    const { id } = useParams();
    const [productData, setProductData] = useState(null);

    useEffect(() => {
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



    return (<Fragment>
        <Grid container className="headerbox">
            <Grid item md={4} sm={11} xs={10}>
                <CustomBreadCrumbs routes={[routes.pos, { title: productData?.productName }]} />
            </Grid>
            <Grid item md={8} sm={11} xs={10}>
            </Grid>
        </Grid>
        <CustomContainer>
            <div className="header-panel">
                {productData ?
                    <h5>{productData?.productName}</h5> :
                    <Box p={2} height={500} bgcolor="white">
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                }
            </div>
        </CustomContainer>
    </Fragment>
    );
};

export default ProductDetails;
