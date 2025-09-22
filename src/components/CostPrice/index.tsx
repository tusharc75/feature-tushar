import { Box, IconButton, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import ManageCostPrice from './ManageCostPrice';
import axiosInstance from 'src/axios/axiosInstance';
import { camelCase, isEmpty } from 'lodash';
import Grid from '@mui/material/Grid2';

const CostPrice = ({ referenceData, type }) => {
  const [costPriceData, setCostPriceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manageCostPrice, setManageCostPrice] = useState(false);

  useEffect(() => {
    if (!isEmpty(referenceData)) {
      fetchData();
    }
  }, [referenceData]);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`/cost-price?type=${type}&materialId=${referenceData?._id}`)
      .then(({ data: { data } }) => {
        setLoading(false);
        if (!isEmpty(data?.costPrice)) {
          setCostPriceData({ ...data?.costPrice, _id: data?._id });
        }
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  return (
    <>
      <Box className={`single-form-v1`} style={{ overflow: 'hidden' }}>
        <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Cost Price</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setManageCostPrice(true);
            }}
            disabled={loading || !referenceData?.pricingMethod?.length || !referenceData?.unit?.length}
          >
            <AddCircleOutline fontSize="small" color={!referenceData?.pricingMethod?.length || !referenceData?.unit?.length || loading ? 'disabled' : 'primary'} />
          </IconButton>
        </Box>
        <Box className="formdata-v1" style={{ minHeight: '250px', maxHeight: '400px', overflow: 'auto' }}>
          {!isEmpty(costPriceData) ? (
            <div className="mt-3">
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '350px' }}>
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th className="border border-gray-300 px-4 py-2"></th>
                      {referenceData?.pricingMethod?.map((method, index) => (
                        <th key={index} className="whitespace-nowrap border border-gray-300 px-4 py-2">
                          {method}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referenceData?.unit?.map((unit, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="border border-gray-300 px-4 py-2 font-bold">{unit}</td>
                        {referenceData?.pricingMethod?.map((method, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 px-4 py-2">
                            <p>{costPriceData?.[`${camelCase(method)}_${unit.toLowerCase()}`]}</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : loading ? (
            <Box width={'100%'}>
              <Grid container>
                <Grid size={{ xs: 6 }} justifyContent={'center'}>
                  <Typography variant="body2">Loading ...</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box width={'100%'}>
              <Grid container>
                <Grid size={{ xs: 6 }} justifyContent={'center'}>
                  <Typography variant="body2">No Data Found</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
      {manageCostPrice && (
        <ManageCostPrice
          onClose={() => {
            setManageCostPrice(false);
          }}
          onSuccess={() => {
            fetchData();
            setManageCostPrice(false);
          }}
          referenceData={{ ...referenceData, type: type }}
          costPriceData={costPriceData}
        />
      )}
    </>
  );
};

export default CostPrice;
