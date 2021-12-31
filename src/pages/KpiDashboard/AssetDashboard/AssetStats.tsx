import React from 'react';
import { Grid, Box, Typography, TextField, Card, CardContent, CircularProgress } from '@material-ui/core';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { startCase } from 'lodash';

import axiosInstance from '../../../axios/axiosInstance';

function AssetStats() {
  const inputRef = React.useRef(null)
  const [assets, setAssets] = React.useState([]);
  const [selectedAssets, setSelectedAssets] = React.useState([]);
  const [assetStats, setAssetStats] = React.useState(null);
  const [loadingStats, setLoadingStats] = React.useState(false);
  const [loadingAssets, setLoadingAssets] = React.useState(false);
  const [page, setPage] = React.useState(1)

  const lastElement = document.querySelector('.MuiAutocomplete-option:last-child');

  const lastOptionObserver = new IntersectionObserver((entries) => {
    const lastOption = entries[0];
    if (!lastOption.isIntersecting && loadingAssets) return;
    setPage(prevState => prevState + 1)
    // console.log("Load More")
  }, {});

  React.useEffect(() => {
    if(lastElement) {
      lastOptionObserver.observe(lastElement);
    }

  },[lastElement])
  console.log(lastElement)


  React.useEffect(() => {
    fetchAssets();
  }, [page]);

  React.useEffect(() => {
    if(selectedAssets.length > 0) {
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

  const fetchAssets = () => {
    setLoadingAssets(true);
    axiosInstance()
      .get('product-inventory?limit=200&page=' + page)
      .then(({ data: { data } }) => {
        setAssets([...assets, ...data.map((d) => ({ id: d._id, title: d.assetNumber }))]);
        setLoadingAssets(false);
      })
      .catch((err) => {
        setLoadingAssets(false);
      });
  };

  return (
    <div>
      <Box my={2} bgcolor={'#f5f5f5'} px={1}>
        <Box my={1}>
          <Autocomplete
            ref={(ref) => {
              if(ref) {
                inputRef.current = ref
              }
            }}
            options={assets}
            limitTags={5}
            multiple={true}
            value={selectedAssets}
            loading={loadingAssets}
            onChange={(_, val) => setSelectedAssets(val)}
            fullWidth
            getOptionSelected={(option, val) => option.id === val.id}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Assets"
                size="medium"
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
          <Box width={'100%'} textAlign="center" py={2}>
            <Typography variant="h4" color="textSecondary">
              Select assets to see their stats
            </Typography>
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
}

export default AssetStats;
