import * as React from 'react';
import { Container, Paper, Typography } from '@material-ui/core';
import { CheckCircle } from '@material-ui/icons';

const CheckoutSuccess = () => {
  return (
    <Container component="main" maxWidth="sm" style={{ marginBottom: 32, marginTop: 40 }}>
      <Paper style={{ padding: '24px 16px' }}>
        <Typography component="h1" variant="h4" align="center">
          Order Completed
        </Typography>
        <CheckCircle fontSize="large" color="secondary" />
      </Paper>
    </Container>
  );
};

export default CheckoutSuccess;
