import { useContext, useEffect, useState } from 'react';
import { Box, Button, Grid, Typography } from '@mui/material';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import BoxWithBorder from 'src/components/BoxWithBorder';
import ManageDoa from './ManageDoa';
import DoaStepper from './Stepper';
import axios, { CancelTokenSource } from 'axios';

const DoaSetup = ({ resource, entity }) => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions }
  }: any = useData();

  const [doaData, setDoaData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (entity) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }
  }, [entity]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/doa-setup?entity=${entity}&resource=${resource}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setDoaData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Box mt={2} className="single-form-v1">
        <div className="form-head-v1">
          <Typography className="form-label-style-v1 pr" component={'h3'}>
            {`${resource} DOA Details`}
          </Typography>
          {permissions.entity?.isUpdate && (
            <Button variant="contained" className="float-right-button-v1" color="primary" size="small" onClick={() => setOpen(true)}>
              {doaData ? `Edit DOA` : `Add DOA`}
            </Button>
          )}
        </div>
        <Box className="formdata-v1">
          <Grid container style={{ padding: '8px' }} spacing={1}>
            <Grid item xs={12} sm={12}>
              <BoxWithBorder
                style={{
                  padding: '0px'
                }}
              >
                {doaData ? (
                  <DoaStepper data={doaData} />
                ) : (
                  <Box textAlign="center" my={2}>
                    <Typography variant="body2">Entity doesn't have any {resource} DOA</Typography>
                  </Box>
                )}
              </BoxWithBorder>
            </Grid>
          </Grid>
        </Box>
      </Box>
      {open && (
        <ManageDoa
          onClose={() => {
            setOpen(false);
          }}
          onSuccess={() => {
            setOpen(false);
            fetchData();
          }}
          resource={resource}
          entity={entity}
          data={doaData}
        />
      )}
    </>
  );
};

export default DoaSetup;
