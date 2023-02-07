import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Paper, Typography } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import BoxWithBorder from '../../../components/BoxWithBorder';
import { Skeleton } from '@material-ui/lab';

const CostDetails = ({ product, productData, className = '' }) => {
  const [averageCost, setAverageCost] = useState(null);

  useEffect(() => {
    axiosInstance()
      .get(`product/${product}/cost`)
      .then(async ({ data: { data } }) => {
        setAverageCost(data?.averagePrice || 0);
      })
      .catch((err) => {});
  }, [product, productData]);

  return (
    <Box className={`single-form-v1 ${className}`}>
      <Box className={'form-head-v1'} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2">Cost Details</Typography>
      </Box>
      {averageCost !== null ? (
        <Box className="formdata-v1">
          <Box display="flex" justifyContent="space-between">
            <Typography className="table-head-v1">List Price</Typography>
            <Typography className="table-data-v1" style={{ borderTopWidth: '1px' }}>
              {productData?.listPrice ? productData?.listPrice : 0}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography className="table-head-v1 bt-0 br-0">Average Cost</Typography>
            <Typography className="table-data-v1  bt-0">{averageCost}</Typography>
          </Box>
          <Box mb={1} display="flex" justifyContent="space-between">
            <Typography className="table-head-v1 bt-0 br-0">Margin</Typography>
            <Typography className="table-data-v1  bt-0">
              {(productData?.listPrice || 0) === 0 ? 0 : (((productData?.listPrice || 0) + averageCost) / (productData?.listPrice || 0)).toFixed(2)}
            </Typography>
          </Box>
        </Box>
      ) : (
        [1, 2].map((i) => (
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
          </BoxWithBorder>
        ))
      )}
    </Box>
  );
};

export default CostDetails;
