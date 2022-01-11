import React from 'react';
import { Grid, Box, Typography, TextField, Card, CardContent, CircularProgress } from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { startCase } from 'lodash';


import axiosInstance from '../../../axios/axiosInstance';
import { FilterType } from './AssetDashboard';
import VirtualizedList from '../../../components/VirtualizedList';

interface FilterProps {
  filter: FilterType;
  assets: any[];
  loading: boolean;
}

const AssetStats = (props: FilterProps) => {
  const { assets, loading } = props;
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [assetStats, setAssetStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(false);

  React.useEffect(() => {
    if (selectedAssets.length > 0) {
      loadAssetsStats();
    }
  }, [selectedAssets]);

  const loadAssetsStats = () => {
    setLoadingStats(true);
    axiosInstance()
      .post('product-inventory/inventory-stats', {
        ids: selectedAssets.map((a) => a.id)
      })
      .then(({ data: { data } }) => {
        setAssetStats(data);
        setLoadingStats(false);
      })
      .catch((err) => {
        setLoadingStats(false);
      });
  };

  return (
    <div>
      <Box my={2} bgcolor={'#f5f5f5'} p={1}>
        <Box my={1}>
          <Autocomplete
            ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
            options={assets}
            disableListWrap
            multiple={true}
            value={selectedAssets}
            loading={loading}
            onChange={(_, val) => setSelectedAssets(val)}
            fullWidth
            size="small"
            getOptionSelected={(option, val) => option.id === val.id}
            getOptionLabel={(option) => option.title}
            renderOption={(option) => <Typography noWrap>{option.title}</Typography>}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Assets"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  )
                }}
              />
            )}
          />
        </Box>
        {selectedAssets.length === 0 && (
          <Box width={'100%'} py={2}>
            <Typography>Select assets to see their stats</Typography>
          </Box>
        )}
        <Grid container spacing={2}>
          {loadingStats &&
            ['1', '2', '3', '4'].map((d) => (
              <Grid key={d} item xs={12} sm={4} md={3}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" height={30} width={200} animation="wave" />
                    <Skeleton variant="text" height={40} width={100} animation="wave" />
                  </CardContent>
                </Card>
              </Grid>
            ))}

          {assetStats &&
            selectedAssets.length > 0 &&
            !loadingStats &&
            Object.keys(assetStats).map((stat: any) => (
              <Grid key={stat} item xs={12} sm={4} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      {startCase(stat)}
                    </Typography>
                    <Typography variant="h5" component="h2">
                      {assetStats[stat] ?? 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </Box>
    </div>
  );
};

export default AssetStats;
