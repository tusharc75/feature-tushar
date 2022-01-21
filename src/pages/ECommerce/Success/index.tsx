import * as React from 'react';
import { Container, Paper, Typography, Box } from '@material-ui/core';
import { CheckCircle, Cancel } from '@material-ui/icons';
import { useLocation, useHistory } from 'react-router-dom';
import { parse } from 'query-string';
import Loader from '../../../components/Loader';
import routes from '../../../components/Helpers/Routes';

const getIcon = (status: string) => {
  switch (status) {
    case 'success': {
      return (
        <Box textAlign={'center'} mt={2}>
          <CheckCircle fontSize="large" color="secondary" />
          <Typography variant='h6' align='center' color='secondary' gutterBottom>
            Thank you, your order was processed successfully
          </Typography>
        </Box>
      );
    }
    case 'failed': {
      return (
        <Box textAlign={'center'} mt={2}>
          <Cancel fontSize="large" color="error" />
          <Typography variant='h6' align='center' color='error' gutterBottom>
            Sorry, your order couldn't be processed
          </Typography>
        </Box>
      );
    }
    default:
      return;
  }
};

const statuses = ['success', 'failed'];

const CheckoutSuccess = () => {
  const location = useLocation();
  const history = useHistory();
  const { status, orderId }: any = parse(location.search);

  if (!status || !statuses.includes(status)) return <Loader noLoader text={'Nothing is here'} minHeight={'100%'} />;

  return (
    <Container component="main" maxWidth="sm" style={{ marginBottom: 32, marginTop: 40 }}>
      <Paper style={{ padding: '24px 16px' }}>
        <Typography component="h1" variant="h4" align="center">
          Order {status}
        </Typography>

        {getIcon(status)}

        <Typography component="h5" variant="h6" align="center" className="cursor-pointer link" onClick={() => {
          history.push(`${routes.orderDetails.path}/${orderId}`)
        }}>
          Click here to check order details
        </Typography>

      </Paper>
    </Container>
  );
};

export default CheckoutSuccess;
