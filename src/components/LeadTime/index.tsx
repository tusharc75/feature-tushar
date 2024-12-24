import { Box, Grid, IconButton, Typography } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import ManageLeadTime from './ManageLeadTime';
import axiosInstance from 'src/axios/axiosInstance';
import { startCase } from 'lodash';

const LeadTime = ({ referenceType, referenceId, referenceLabel }) => {
  const [leadTimeData, setLeadTimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [referenceType, referenceId]);

  const fetchData = () => {
    setLoading(true);
    axiosInstance()
      .get(`/lead-time?referenceType=${referenceType}&referenceId=${referenceId}`)
      .then(({ data: { data } }) => {
        setLoading(false);
        setLeadTimeData(data);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  return (
    <>
      <Box className={`single-form-v1`} style={{ overflow: 'hidden' }}>
        <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Lead Time</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setOpen(true);
            }}
          >
            <AddCircleOutline fontSize="small" />
          </IconButton>
        </Box>
        <Box className="formdata-v1" style={{ minHeight: '250px' }}>
          {leadTimeData?.steps?.length ? (
            <>
              <Box width={'100%'}>
                <Grid container>
                  <Grid item xs={2}>
                    <Typography className="table-head-v1 br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Index
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Status
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className="table-head-v1 text-truncate" style={{ width: '100%' }} variant="body1">
                      Days
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              {leadTimeData?.steps?.map((step, index) => (
                <Box key={index} width={'100%'}>
                  <Grid container>
                    <Grid item xs={2}>
                      <Typography className="table-body-v1 bt-0 br-0" style={{ width: '100%' }} variant="body2">
                        {index + 1}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }}>
                        {step?.leadTimeStatus || ''}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography className="table-body-v1 bt-0 text-truncate" style={{ width: '100%' }}>
                        {step?.days || 0}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Box width={'100%'}>
                <Grid container>
                  <Grid item xs={2}>
                    <Typography variant="body2"></Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography className="table-head-v1  bt-0 br-0" style={{ width: '100%' }}>
                      Total
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className="table-body-v1  bt-0" style={{ width: '100%' }}>
                      {leadTimeData?.leadTimeDays || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          ) : loading ? (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={6} justifyContent={'center'}>
                  <Typography variant="body2">Loading ...</Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box width={'100%'}>
              <Grid container>
                <Grid item xs={6} justifyContent={'center'}>
                  <Typography variant="body2">No Data Found</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
      {open && (
        <ManageLeadTime
          onClose={() => {
            setOpen(false);
          }}
          onSuccess={() => {
            fetchData();
            setOpen(false);
          }}
          referenceType={referenceType}
          referenceId={referenceId}
          referenceData={leadTimeData}
          referenceLabel={`${startCase(referenceType)} - ${referenceLabel}`}
        />
      )}
    </>
  );
};

export default LeadTime;
