import * as React from 'react';
import { Typography, Box, Grid, List, ListItem, ListItemText, Divider } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

interface ReviewProps {
  totalAmount?: number | string;
  cartItems?: any | any[];
}

const Review = (props: ReviewProps) => {
  const { totalAmount, cartItems } = props;
  return (
    <React.Fragment>
      <Typography component="h2" variant="h5" gutterBottom>
        Order summary
      </Typography>

      <List disablePadding>
        {cartItems.length > 0 ? (
          cartItems.map((item: any) => (
            <ListItem>
              <ListItemText primary={`${item.itemName}`} />
              <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
                {item.formattedAmount}
              </Typography>
            </ListItem>
          ))
        ) : (
          <>
            <ListItem>
              <ListItemText primary={<Skeleton variant="text" width={100} />} />
              <Skeleton variant="text" width={40} />
            </ListItem>
            <ListItem>
              <ListItemText primary={<Skeleton variant="text" width={100} />} />
              <Skeleton variant="text" width={40} />
            </ListItem>
            <ListItem>
              <ListItemText primary={<Skeleton variant="text" width={100} />} />
              <Skeleton variant="text" width={40} />
            </ListItem>
          </>
        )}
        <Divider />
        <ListItem>
          <ListItemText primary={'Total - '} />
          <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
            {totalAmount ? totalAmount : '$ 0'}
          </Typography>
        </ListItem>
      </List>
      {/* <Grid container justifyContent="space-between">
        <Grid item xs={6}>
          <Box display="flex" justifyContent="flex-start">
            <Typography >Total -</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" justifyContent="flex-end">
            <Typography variant="subtitle1" style={{ fontWeight: 700 }}>
              {totalAmount ?? "$0"}
            </Typography>
          </Box>
        </Grid>
      </Grid> */}
    </React.Fragment>
  );
};

export default Review;
