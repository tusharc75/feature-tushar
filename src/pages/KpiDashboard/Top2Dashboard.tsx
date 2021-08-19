import React from 'react';
import {
  Grid,
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  FormControl,
  Select,
  InputLabel,
  MenuItem
} from '@material-ui/core';

const Top2Dashboard = ({ topProducts, openQuoteData, allEntitySalesData, Chart }) => {
  return (
    <Grid container spacing={2}>
      <Grid item sm={4}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6" color="textSecondary">
              Top Selling Product Category
            </Typography>
          </Box>

          <List>
            {topProducts.length ? (
              topProducts.map((product) => (
                <ListItem divider>
                  <ListItemText primary={product.productCategory} />
                  <ListItemSecondaryAction>
                    <Typography variant="h6">{product.count}</Typography>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary={'No Data'} />
              </ListItem>
            )}
          </List>
        </Paper>
      </Grid>
      <Grid item sm={8}>
        <Paper elevation={2}>
          <Box p={2}>
            <Box textAlign="center">
              <Typography variant="h5">Total booked value in USD</Typography>
            </Box>

            <Chart type="bar" data={allEntitySalesData} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Top2Dashboard;
