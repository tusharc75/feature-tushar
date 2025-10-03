import { Box, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AddCircleOutline } from '@mui/icons-material';
import { useState } from 'react';
import ManageAllocationPercentage from './ManageAllocationPercentage';

const AllocationPercentage = ({ referenceData, onRefresh }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box className={`single-form-v1`} style={{ overflow: 'hidden' }}>
        <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Allocation Percentage</Typography>
          <IconButton
            size="small"
            onClick={() => {
              setOpen(true);
            }}
          >
            <AddCircleOutline fontSize="small" color='primary' />
          </IconButton>
        </Box>
        <Box className="formdata-v1" style={{ minHeight: '250px' }}>
          {referenceData?.allocations?.length ? (
            <>
              <Box width={'100%'}>
                <Grid container>
                  <Grid size={{ xs: 2 }} >
                    <Typography className="table-head-v1 br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Index
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} >
                    <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Allocation Detail
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }} >
                    <Typography className="table-head-v1 text-truncate" style={{ width: '100%' }} variant="body1">
                      Percentage
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              {referenceData?.allocations?.map((allocation, index) => (
                <Box key={index} width={'100%'}>
                  <Grid container>
                    <Grid size={{ xs: 2 }} >
                      <Typography className="table-body-v1 bt-0 br-0" style={{ width: '100%' }} variant="body2">
                        {index + 1}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} >
                      <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }}>
                        {allocation?.name || ''}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }} >
                      <Typography className="table-body-v1 bt-0 text-truncate" style={{ width: '100%' }}>
                        {allocation?.percentage ? `${allocation?.percentage}%` : '0%'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </>
          ) : (
            <Box width={'100%'}>
              <Grid container>
                <Grid size={{ xs: 6 }} justifyContent={'center'}>
                  <Typography variant="body2">No Data Found</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
      {open && (
        <ManageAllocationPercentage
          onClose={() => {
            setOpen(false);
          }}
          onSuccess={() => {
            setOpen(false);
            // Trigger a refresh of the parent component data
            if (onRefresh) {
              onRefresh();
            }
          }}
          referenceData={referenceData}
          referenceLabel={`Service - ${referenceData?.serviceName || ''}`}
        />
      )}
    </>
  );
};

export default AllocationPercentage;
