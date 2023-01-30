import { Box, Button, Chip, Grid, IconButton, Typography, useMediaQuery } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Approver = ({ approver }) => {
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={5} md={4} lg={3}>
          <Box>
            <Grid
              container
              spacing={2}
              style={{
                flexDirection: 'column'
              }}
            >
              {approver ? (
                approver?.map((item, index) => (
                  <Grid item xs={12} key={index}>
                    <Box
                      style={{
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        backgroundColor: 'white',
                        borderColor: 'rgb(224, 224, 224)',
                        cursor: 'pointer',
                        transition: '.3s'
                      }}
                      p={2}
                      onClick={() => {}}
                    >
                      <>
                        <Box ml={'10px'}>
                          <Typography>{item?.optionLabel}</Typography>
                        </Box>
                      </>
                    </Box>
                  </Grid>
                ))
              ) : (
                <Box p={2} height={500} bgcolor="white">
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={12} sm={7} md={8} lg={9}>
          <Box textAlign="center">
            <p>No services</p>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Approver;
