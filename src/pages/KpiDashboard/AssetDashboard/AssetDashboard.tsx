import React from 'react';
import { Grid, Box, useMediaQuery, useTheme, CircularProgress, Typography } from '@material-ui/core';

import axiosInstance from '../../../axios/axiosInstance';
import MapView from './MapView';
import AssetFilters from './AssetFilters';
import AssetChart from './AssetChart';
import { useData } from '../../../StateProvider/Provider';

export type FilterType = {
  productCategory: { id: string; title: string }[];
  productDescription: { id: string; title: string }[];
  country: { default: boolean; order: number; optionValue: string; optionLabel: string } | any;
};

const AssetDashboard = () => {
  const { state: { selectedEntity } } = useData()
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [assetLocationData, setAssetLocationData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>({
    productCategory: [],
    productDescription: [],
    country: {}
  });

  React.useEffect(() => {

    let timeout: ReturnType<typeof setTimeout> = null;

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      fetchLocationBase();
    }, 500)

    return () => {
      timeout = null
    }

  }, [filter, selectedEntity]);



  const fetchLocationBase = () => {
    setLoading(true);
    let url = '?';
    Object.keys(filter).forEach((key) => {
      if (Array.isArray(filter[key]) && filter[key].length > 0) {
        url = `${url}${key}=${JSON.stringify(filter[key].map((p) => p?.id))}&`;
      }
      if (!Array.isArray(filter[key]) && typeof filter[key] === 'object' && key === 'country' && Object.keys(filter[key]).length > 0) {
        url = `${url}${key}=${filter[key].optionValue}&`;
      }
    });

    axiosInstance()
      .get(`dashboard/location-base-assets${url}`)
      .then(({ data }) => {
        setAssetLocationData(data.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <div>
      <Box mb={1} minWidth={'300px'}>
        <AssetFilters filter={filter} setFilter={setFilter} loading={loading} />
      </Box>
      <Box position={'relative'} width={'100%'}>
        {loading && (
          <Box
            width={'100%'}
            height={'100%'}
            position={'absolute'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            zIndex={10}
            bgcolor={'rgba(255, 255, 255, 0.7)'}
          >
            <Box textAlign={'center'}>
              <CircularProgress size={28} color="primary" />
              <Typography color="textSecondary">Loading Data...</Typography>
            </Box>
          </Box>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <MapView smallScreen={smallScreen} data={assetLocationData} loading={loading} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AssetChart smallScreen={smallScreen} />
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default AssetDashboard;
