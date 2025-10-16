import { Box, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AddCircleOutline } from '@mui/icons-material';
import { useState } from 'react';
import ManageAllocationPercentage from './ManageAllocationPercentage';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { updateDisable } from 'src/constants/messageHelpers';
import { useData } from 'src/StateProvider/Provider';

const AllocationPercentage = ({ referenceData, onRefresh }) => {

  const [open, setOpen] = useState(false);
  const {
    state: { permissions }
  }: any = useData();

  return (
    <>
      <Box className={`single-form-v1`} style={{ overflow: 'hidden' }}>
        <Box className={'form-head-v1'} justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">Allocations</Typography>
          <HtmlTooltip title={permissions?.serviceMaster?.isUpdate ? referenceData?.allocations?.length ? "Update" : "Add" : updateDisable}>
            <IconButton
              size="small"
              onClick={() => {
                setOpen(true);
              }}
              disabled={!permissions?.serviceMaster?.isUpdate}
            >
              <AddCircleOutline fontSize="small" color={permissions?.serviceMaster?.isUpdate ? 'primary' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
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
                  <Grid size={{ xs: 3 }} >
                    <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Revenue Class
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }} >
                    <Typography className="table-head-v1  br-0 text-truncate" style={{ width: '100%' }} variant="body1">
                      Department
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
                    <Grid size={{ xs: 3 }} >
                      <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }}>
                        {allocation?.revenueClass || '--'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 3 }} >
                      <Typography className="table-body-v1 bt-0 br-0 text-truncate" style={{ width: '100%' }}>
                        {allocation?.department || '--'}
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
                <Grid size={{ xs: 12 }} justifyContent={'center'}>
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
