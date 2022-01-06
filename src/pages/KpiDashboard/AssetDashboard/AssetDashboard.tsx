import React from 'react';
import { Grid, Box, useMediaQuery, useTheme, CircularProgress, Typography, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import axiosInstance from '../../../axios/axiosInstance';
import MapView from './MapView';
import AssetFilters from './AssetFilters';
import AssetChart from './AssetChart';
import { useData } from '../../../StateProvider/Provider';
import AssetStats from './AssetStats';

import routes from '../../../components/Helpers/Routes';
import AssetStatusChart from './AssetStatusChart';
import RentalChart from './RentalChart';

export type FilterType = {
  productCategory: { id: string; title: string }[];
  productDescription: { id: string; title: string }[];
  country: { default: boolean; order: number; optionValue: string; optionLabel: string } | any;
};

const AssetDashboard = ({ salesFilter }) => {
  const {
    state: { selectedEntity }
  } = useData();
  const {
    between: { from, to }
  } = salesFilter;
  const theme = useTheme();
  const smallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [assetLocationData, setAssetLocationData] = React.useState([]);
  const [assetUtilizationData, setAssetUtilizationData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingChartData, setLoadingChartData] = React.useState(false);
  const [limit, setLimit] = React.useState('10');
  const [filter, setFilter] = React.useState<FilterType>({
    productCategory: [],
    productDescription: [],
    country: {}
  });
  const [allProductCategories, setAllProductCategories] = React.useState([]);
  const [loadingProductCategory, setLoadingProductCategory] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);

    let timeout: ReturnType<typeof setTimeout> = null;

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fetchLocationBase();
    }, 200);

    return () => {
      timeout = null;
      setLoading(false);
    };
  }, [filter, selectedEntity]);

  const fetchLocationBase = () => {
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

  React.useEffect(() => {
    if (selectedEntity) {
      fetchAssetsData();
    }
  }, [from, to, selectedEntity, limit]);

  React.useEffect(() => {
    fetchProductCategory();
  }, []);

  const fetchProductCategory = () => {
    setLoadingProductCategory(true);
    axiosInstance()
      .get(`${routes.productCategory.path}?limit=0`)
      .then(({ data: { data } }) => {
        setAllProductCategories(data.map((d) => ({ id: d._id, title: d.name })));
        setLoadingProductCategory(false);
      })
      .catch((err) => {
        setLoadingProductCategory(false);
      });
  };

  const fetchAssetsData = () => {
    let params = {
      between: JSON.stringify({
        from: new Date(from).toISOString().split('T')[0],
        to: new Date(to).toISOString().split('T')[0]
      })
    };

    let url = '';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && from && to) {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    setLoadingChartData(true);

    axiosInstance()
      .get(`/dashboard/assets-total-in-use?limit=${limit}&page=0&${url}`)
      .then(({ data: { data } }) => {
        setAssetUtilizationData(data.data);
        setLoadingChartData(false);
      })
      .catch(() => {
        setLoadingChartData(false);
      });
  };

  return (
    <div>
      <Box mb={1} display="flex" justifyContent="space-between" alignItems={'center'} height={50}>
        <AssetFilters
          filter={filter}
          setFilter={setFilter}
          loading={loading}
          productCategories={allProductCategories}
          loadingProductCategory={loadingProductCategory}
        />
        <Box>
          <Autocomplete
            options={['10', '20', '50', '100', '200']}
            value={limit}
            onChange={(_, val) => setLimit(val ? val : '10')}
            style={{ width: 100 }}
            loading={loadingChartData}
            getOptionSelected={(option, val) => option === val}
            getOptionLabel={(option) => option}
            renderInput={(params) => <TextField {...params} variant="outlined" label="Limit" size="small" />}
          />
        </Box>
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
            <AssetChart loading={loading || loadingChartData || loadingProductCategory} data={assetUtilizationData} />
          </Grid>
        </Grid>
        <Box>
          <AssetStatusChart productCategories={allProductCategories} loadingProductCategory={loadingProductCategory} />
        </Box>
        <Box my={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <RentalChart />
            </Grid>
            <Grid item xs={12} sm={6}></Grid>
          </Grid>
        </Box>
        <Box my={2}>
          <AssetStats filter={filter} />
        </Box>
      </Box>
    </div>
  );
};

export default AssetDashboard;
