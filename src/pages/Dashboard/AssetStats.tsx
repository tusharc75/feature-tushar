import React from 'react';
import { Box, Typography, Paper, TextField, Card, CardContent, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Autocomplete, Skeleton } from '@mui/material';
import axiosInstance from 'src/axios/axiosInstance';
import VirtualizedList from 'src/components/VirtualizedList';
import { round } from 'lodash';
import dayjs from 'dayjs';

const AssetStats = () => {
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [assets, setAssets] = React.useState([]);
  const [assetStats, setAssetStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [loadingAssets, setLoadingAssets] = React.useState(false);
  const [searchVal, setSearchVal] = React.useState('');

  React.useEffect(() => {
    if (selectedAssets.length > 0) {
      featchData();
    }
  }, [selectedAssets]);

  const featchData = () => {
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
    <Box component={Paper} my={2} p={1}>
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
          isOptionEqualToValue={(option, val) => option.optionValue === val.optionValue}
          getOptionLabel={(option) => option.optionLabel}
          renderOption={(props, option, state, ownerState) => {
            const { key, ...optionProps } = props;
            return (
              <Box key={key} component="li" {...optionProps}>
                <Typography noWrap>{ownerState.getOptionLabel(option)}</Typography>
              </Box>
            );
          }}
          onInputChange={(_, val) => setSearchVal(val)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Search Assets"
              size="small"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loadingAssets ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  )
                }
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
            <Grid key={d} size={{ xs: 12, sm: 4, md: 3 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={30} width={200} animation="wave" />
                  <Skeleton variant="text" height={40} width={100} animation="wave" />
                </CardContent>
              </Card>
            </Grid>
          ))}

        {assetStats && selectedAssets.length > 0 && !loadingStats && (
          <>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Rental Jobs
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="h5" component="h2">
                      {assetStats?.totalRentalJobs || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Repair
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="h5" component="h2">
                      {assetStats?.totalRepairJobs || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Utilization
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Box ml={1}>
                      <Typography variant="h5" component="h2">
                        {assetStats?.totalUtilization
                          ? `${round(dayjs.duration(assetStats?.totalUtilization).asHours())}:${Math.floor(dayjs.duration(assetStats?.totalUtilization).asMinutes() % 60)}`
                          : 0}
                      </Typography>
                    </Box>
                    <Box ml={1}>
                      <Typography variant="body1">Hours</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    No. Of Rental Jobs After Last Repair
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="h5" component="h2">
                      {assetStats?.noOfRentalJobsAfterLastRepair || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    No. Of Days After Last Repair
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="h5" component="h2">
                      {assetStats?.noOfDaysAfterLastRepair || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total In-Use Time After Last Repair
                  </Typography>
                  <Box display="flex" alignItems="flex-end">
                    <Box ml={1}>
                      <Typography variant="h5" component="h2">
                        {assetStats?.totalInUseTimeAfterLastRepair
                          ? `${round(dayjs.duration(assetStats?.totalInUseTimeAfterLastRepair).asHours())}:${Math.floor(dayjs.duration(assetStats?.totalInUseTimeAfterLastRepair).asMinutes() % 60)}`
                          : 0}
                      </Typography>
                    </Box>
                    <Box ml={1}>
                      <Typography variant="body1">Hours</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default AssetStats;
