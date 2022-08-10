import { useState, useEffect } from 'react';
import { Box, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

import ConfiguratorDialog from './ConfiguratorDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { serviceMaster } from 'src/constants/helpers';

const Configuration = ({ id, type }) => {
  const [loadingPLT, setLoadingPLT] = useState(false);
  const [configuration, setConfiguration] = useState([]);
  const [configurationDialog, setConfigurationDialog] = useState(false);
  const [isAssigning, setAssigning] = useState(false);
  const { api } = serviceMaster;

  useEffect(() => {
    fetchConfiguration();
  }, [id]);

  const fetchConfiguration = async () => {
    setLoadingPLT(true);

    axiosInstance()
      .get(`${api}/configure-fields/${id}`)
      .then(({ data: { data } }) => {
        setConfiguration(data);
        setLoadingPLT(false);
      })
      .catch((err) => {
        setLoadingPLT(false);
      });
  };

  return (
    <>
      <Paper style={{ overflow: 'hidden' }}>
        <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Configuration</Typography>
          <Box>
            <IconButton
              size="small"
              onClick={() => {
                setConfigurationDialog(true);
              }}
            >
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {configuration.length > 0 && (
          <Box p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={6}>
                <Typography style={{ fontWeight: '500' }} variant="body1">
                  Field Label
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography style={{ fontWeight: '500' }} variant="body1">
                  Field Type
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        {configuration.length ? (
          configuration.map((field: any, index: number) => (
            <Box key={index} p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
              <Grid container>
                <Grid item xs={6}>
                  <Typography variant="body1">{field.fieldLabel}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body1">{field.type}</Typography>
                </Grid>
              </Grid>
            </Box>
          ))
        ) : (
          <Box bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
            <Grid container>
              <Grid item xs={6} justifyContent={'center'}>
                <Typography variant="body2">No Data Found</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      {configurationDialog && (
        <ConfiguratorDialog
          fetchConfiguration={fetchConfiguration}
          id={id}
          configuration={configuration}
          close={() => {
            setConfigurationDialog(false);
          }}
        />
      )}
    </>
  );
};

export default Configuration;
