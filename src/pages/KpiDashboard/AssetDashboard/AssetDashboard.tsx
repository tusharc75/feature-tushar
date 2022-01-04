import React from 'react';
import { Grid, Box, useMediaQuery, useTheme, CircularProgress, Typography, TextField, Paper, Card, CardContent, Checkbox } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import axiosInstance from '../../../axios/axiosInstance';
import MapView from './MapView';
import AssetFilters from './AssetFilters';
import AssetChart from './AssetChart';
import { useData } from '../../../StateProvider/Provider';
import AssetStats from './AssetStats';
import { ChartData } from 'chart.js';
import Chart from 'react-chartjs-2';
import { CheckBoxOutlineBlank, CheckBox } from '@material-ui/icons';
import routes from '../../../components/Helpers/Routes';

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
  const [pieData, setPieData] = React.useState<ChartData>(null)
  const [allProductCategories, setAllProductCategories] = React.useState([]);
  const [selectedProductCategories, setSelectedProductCategories] = React.useState([]);
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
    if (selectedEntity && from && to && limit) {
      fetchAssetsData();
    }
  }, [from, to, selectedEntity, limit]);

  React.useEffect(() => {
    if (selectedEntity && from && to && limit) {
      fetchAssetsData();
    }
    fetchProductCategory()
  }, []);
  React.useEffect(() => {
    if (selectedProductCategories.length > 0) {
      productWithStatus()
    }
  }, [selectedProductCategories]);

  const getSum = (array, column) => {
    let values = array.map((item) => parseInt(item[column]) || 0)
    return values.reduce((a, b) => a + b)
  }
  const ignoreId = ["productName", "_id"]
  const productWithStatus = () => {
    let filterById = [];
    selectedProductCategories.forEach(d => {
      filterById.push(d.id);
    })
    axiosInstance()
      .get(`/dashboard/product-with-status-count?productCategory=${JSON.stringify(filterById)}`)
      .then(({ data: { data } }) => {
        let labels = []
        let values = []
        if (data.data.length > 0) {
          Object.keys(data.data[0]).map((label: any) => {
            if (!ignoreId.includes(label)) {
              values.push(getSum(data.data, label))
              labels.push(label)
            }
          }
          )
        }
        setPieData({
          "labels": labels,
          datasets: [{
            label: "(%) Utilization",
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)'
            ],
            fill: true
          }]
        })
      })
  };

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
        <AssetFilters filter={filter} setFilter={setFilter} loading={loading} />
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
            <AssetChart loading={loading || loadingChartData} data={assetUtilizationData} />
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <Box width={200} mb={1}>
            <Autocomplete
              disabled={loading}
              fullWidth
              disableListWrap
              loading={loadingProductCategory}
              loadingText={'Loading...'}
              multiple={true}
              value={selectedProductCategories}
              options={allProductCategories}
              disableCloseOnSelect
              limitTags={2}
              onChange={(_, newVal) => setSelectedProductCategories(newVal)}
              getOptionSelected={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.title}
              renderOption={(option, { selected }) => (
                <React.Fragment>
                  <Checkbox
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.title}
                </React.Fragment>
              )}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Product Category" size="small" />}
            />
          </Box>
          <Box height={400}>
            <Chart
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={pieData}
            />
          </Box>
        </Grid>
        <AssetStats filter={filter} />
      </Box>
    </div>
  );
};

export default AssetDashboard;
