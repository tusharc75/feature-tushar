import React from 'react';
import { Grid, Box, Typography, Paper, TextField, Card, CardContent, CircularProgress } from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { upperCase, lowerCase } from 'lodash';

import axiosInstance from 'src/axios/axiosInstance';
import VirtualizedList from 'src/components/VirtualizedList';
import { msToHour } from 'src/constants/helpers';

const AssetStats = () => {
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [assets, setAssets] = React.useState([]);
  const [assetStats, setAssetStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [loadingAssets, setLoadingAssets] = React.useState(false);
  const [searchVal, setSearchVal] = React.useState('');

  React.useEffect(() => {
    if (selectedAssets.length > 0) {
      loadAssetsStats();
    }
  }, [selectedAssets]);

  const loadAssetsStats = () => {
    setLoadingStats(true);
    axiosInstance()
      .post('serialized-asset/inventory-stats', {
        ids: selectedAssets.map((a) => a.optionValue)
      })
      .then(({ data: { data } }) => {
        setAssetStats(data);
        setLoadingStats(false);
      })
      .catch((err) => {
        setLoadingStats(false);
      });
  };

  React.useEffect(() => {
    if (!searchVal) return;
    const timeout = setTimeout(searchAssets, 200);
    return () => {
      clearTimeout(timeout);
    };
  }, [searchVal]);

  const searchAssets = () => {
    setLoadingAssets(true);
    axiosInstance()
      .get(`/serialized-asset/search-assets?assetNumber=${searchVal}`)
      .then(({ data: { data } }) => {
        setAssets(data);
        setLoadingAssets(false);
      })
      .catch((err) => {
        setLoadingAssets(false);
      });
  };

  return (
    <Box component={Paper} my={2} bgcolor={'#f5f5f5'} p={1}>
      <Box my={1}>
        <Autocomplete
          disableCloseOnSelect
          ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          options={assets}
          disableListWrap
          multiple={true}
          value={selectedAssets}
          loading={loadingAssets}
          onChange={(_, val) => setSelectedAssets(val)}
          fullWidth
          size="small"
          getOptionSelected={(option, val) => option.optionValue === val.optionValue}
          getOptionLabel={(option) => option.optionLabel}
          renderOption={(option) => <Typography noWrap>{option.optionLabel}</Typography>}
          onInputChange={(_, val) => setSearchVal(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Search Assets"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loadingAssets ? <CircularProgress color="inherit" size={20} /> : null}
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
          <Typography>Search and select assets to see their stats</Typography>
        </Box>
      )}
      <Grid container spacing={2} alignItems={'stretch'}>
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
                    {`${upperCase(stat?.substring(0,1))}${lowerCase(stat.substring(1,stat?.length))}`}
                  </Typography>
                  <Box display='flex' alignItems='flex-end'>
                    <Typography variant="h5" component="h2">
                      {assetStats[stat] ? (stat?.includes('totalUtilization') ? msToHour(assetStats[stat]) : assetStats[stat]) : 0}
                    </Typography>
                    {stat?.includes('totalUtilization') &&<Box ml={1}><Typography variant="body1">Hours</Typography></Box>}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AssetStats;
