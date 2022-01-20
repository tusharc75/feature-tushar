import * as React from 'react';
import { Box, Container, Paper, Button, Typography, CircularProgress } from '@material-ui/core';
import { useLocation, useHistory } from 'react-router-dom';
import { parse } from 'query-string';

import PaymentForm from './PaymentForm';
import Review from './Review';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { formatAmountWithCurrency } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';

const Checkout = () => {
  const { dispatch }: any = useData();
  const location = useLocation();
  const history = useHistory();
  const toastConfig = React.useContext(CustomToastContext);
  const { shipTo, billTo } = parse(location.search);
  const [totalAmount, setTotalAmount] = React.useState('');
  const [cartItems, setCartItems] = React.useState([]);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    cardNumber: '',
    cvv: '',
    expiryDate: ''
  });

  React.useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = () => {
    axiosInstance()
      .get(`/ecommerce/cart`)
      .then(({ data: { data } }) => {
        if (data) {
          dispatch({ type: SET_CART, payload: [...data] });
          setCartItems(
            data.map((d: any) => ({
              ...d,
              formattedAmount: formatAmountWithCurrency(d?.currency, d.rate)?.fullFormatAmount,
              itemName: d.productDetail.productName
            }))
          );
          if (data.length > 0) {
            const tempTotalPrice = data.reduce((acc: any, curr: any) => {
              return acc + curr.qty * curr.rate;
            }, 0);
            setTotalAmount(formatAmountWithCurrency(data[0].currency, tempTotalPrice)?.fullFormatAmount);
          } else {
            setTotalAmount('');
          }
        }
      });
  };

  const handleSubmit = () => {
    const emptyFields = Object.keys(form).filter((val: string) => !form[val]);
    if (emptyFields.length > 0) {
      setError('Please fill all the required(*) fields');
      setTimeout(() => setError(''), 8 * 1000);
      return;
    }

    setSubmitting(true);
    axiosInstance()
      .post('/ecommerce/checkout', {
        cart: cartItems.map((m) => m._id),
        shippingAddress: shipTo,
        billingAddress: billTo
      })
      .then(({ data }) => {
        setSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        history.push(`${routes.eCommerce.path}/cart/finish?status=success`)
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
        history.push(`${routes.eCommerce.path}/cart/finish?status=failed`)
      });
  };

  return (
    <Container component="main" maxWidth="sm" style={{ marginBottom: 32, marginTop: 40 }}>
      <Paper style={{ padding: '24px 16px' }}>
        <Typography component="h1" variant="h4" align="center">
          Checkout
        </Typography>
        <Box mt={2}>
          <Box my={2}>
            <Review totalAmount={totalAmount} cartItems={cartItems} />
          </Box>
          <PaymentForm form={form} setForm={setForm} error={error} />
          <Box>
            <Button
              disabled={submitting}
              endIcon={submitting && <CircularProgress size={18} color="inherit" />}
              variant="contained"
              fullWidth
              color="primary"
              onClick={handleSubmit}
              style={{ marginTop: 24 }}
            >
              Place order
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;
