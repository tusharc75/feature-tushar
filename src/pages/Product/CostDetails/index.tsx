import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Paper, Typography } from "@material-ui/core";
import axiosInstance from '../../../axios/axiosInstance';
import BoxWithBorder from '../../../components/BoxWithBorder';
import { Skeleton } from '@material-ui/lab';

const CostDetails = ({ product, productData }) => {

    const [averageCost, setAverageCost] = useState(null);

    useEffect(() => {
        axiosInstance().get(`product/${product}/cost`)
            .then(async ({ data: { data } }) => {
                setAverageCost(data?.averagePrice || 0)
            })
            .catch((err) => {
            });
    }, [product, productData]);

    return (
        <Paper style={{ overflow: 'hidden' }}>
            <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Cost Details</Typography>
            </Box>
            {averageCost !== null ?
                <>
                    <Box mx={2} mt={1} display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2">List Price</Typography>
                        <Typography variant="subtitle2">{productData?.listPrice ? productData?.listPrice : 0}</Typography>
                    </Box>
                    <Box mx={2} mt={1} display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2">Average Cost</Typography>
                        <Typography variant="subtitle2">{averageCost}</Typography>
                    </Box>
                    <Box mx={2} mt={1} mb={1} display="flex" justifyContent="space-between">
                        <Typography variant="subtitle2">Margin</Typography>
                        <Typography variant="subtitle2">{(productData?.listPrice || 0) === 0 ?
                            0 : (((productData?.listPrice || 0) + averageCost) / (productData?.listPrice || 0)).toFixed(2)}</Typography>
                    </Box>
                </> : [1, 2].map((i) => (
                    <BoxWithBorder
                        key={i}
                        style={{
                            margin: '8px'
                        }}
                    >
                        <Box padding={1}>
                            <Skeleton variant="text" width="100px" height="20px" />
                            <Box marginTop={1} />
                            <Skeleton variant="text" width="100%" height="15px" />
                        </Box>
                    </BoxWithBorder>))
            }
        </Paper>
    )
}

export default CostDetails;
