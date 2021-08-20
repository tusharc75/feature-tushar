import { Grid, Box, Paper, Typography, Table, TableBody, TableContainer, TableRow, TableCell, TableHead } from '@material-ui/core';
import { startCase } from 'lodash';

const TopDashboard = (props) => {
  const { salesRevenue, salesData, Chart, regionSales } = props;
  return (
    <Grid container spacing={2}>
      <Grid item sm={8}>
        <Box mb={2}>
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Booked Value
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    ${salesRevenue.revenue?.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Total Cost
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    ${salesRevenue.spend?.toLocaleString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper>
                <Box p={2} textAlign="center">
                  <Typography variant="h6" color="textSecondary">
                    Profits
                  </Typography>
                  <Typography variant="h5" color="textPrimary">
                    {salesRevenue.profit}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Paper elevation={2}>
          <Box p={2}>
            <Box textAlign="center">
              <Typography variant="h5">Total booked value in USD</Typography>
            </Box>

            <Chart type="bar" data={salesData} />
          </Box>
        </Paper>
      </Grid>
      <Grid item sm={4}>
        <TableContainer style={{ maxHeight: 450 }} component={Paper}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {regionSales.length > 0 &&
                  Object.keys(regionSales[0]).map((label, i) => (
                    <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                      {startCase(label)}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {regionSales.length > 0 ? (
                regionSales.map((data) => (
                  <TableRow key={data.region}>
                    {Object.keys(data).map((label, i) => (
                      <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                        {data[label]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <Box p={2}>
                  <Typography>No Data for regional sales</Typography>
                </Box>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
};

export default TopDashboard;
