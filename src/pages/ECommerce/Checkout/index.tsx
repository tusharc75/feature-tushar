import { useEffect, useContext, useState } from 'react';
import {
  Box, Container, Paper, Button, Typography, CircularProgress,
  TextField, Divider, FormControlLabel, Radio, RadioGroup, Grid, Checkbox
} from '@material-ui/core';
import { useLocation, useHistory } from 'react-router-dom';
import { parse } from 'query-string';
import PaymentForm from './PaymentForm';
import Review from './Review';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import { useData } from '../../../StateProvider/Provider';
import { SET_CART } from '../../../StateProvider/actionTypes';
import { displayDate, formatAmountWithCurrency } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import moment from 'moment';
import NumberFormat, { NumberFormatValues } from 'react-number-format';

interface NumberFormatCustomProps {
  inputRef: (instance: NumberFormat | null) => void;
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const CustomFormatCardCVV = (props: NumberFormatCustomProps | any) => {
  const { inputRef, onChange, ...other } = props;
  return <NumberFormat {...other} getInputRef={inputRef} isNumericString />;
};

const Checkout = () => {
  const { dispatch }: any = useData();
  const location = useLocation();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { shipTo, billTo } = parse(location.search);
  const [totalAmount, setTotalAmount] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cardNumber: '',
    cvv: '',
    expiryDate: ''
  });
  const [value, setValue] = useState('saved_card');
  const [savedCard, setSavedCard] = useState('card_1');
  const [cvv, setCvv] = useState("")
  const [walletBalance, setWalletBalance] = useState(0);
  const [payFromWallet, setPayFromWallet] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleChangeSavedCard = (event) => {
    setSavedCard(event.target.value);
  };

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
    if (value === "new_card") {
      const emptyFields = Object.keys(form).filter((val: string) => !form[val]);
      if (emptyFields.length > 0) {
        setError('Please fill all the required(*) fields');
        setTimeout(() => setError(''), 8 * 1000);
        return;
      }
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
        history.push(`${routes.orderDetails.path}/${data.data.orderId}?status=success`);
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
        history.push(`${routes.eCommerce.path}/cart/finish?status=failed`)
      });
  };

  return (
    <Grid container className="mt-3">

      <Grid item xs={8}>
        <Container component="main">
          <Paper className="px-3">
            <Typography component="h1" variant="h4">
              Checkout
            </Typography>

            <Box my={2} py={2}>
              <div style={{ background: "#16334008" }} className="p-3 border-radius-2 border">
                <Typography variant="h6">
                  Wallet Balance $ {walletBalance}
                </Typography>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={payFromWallet}
                      disabled={walletBalance === 0}
                      name="checkedB"
                      color="primary"
                      onChange={() => {
                        setPayFromWallet(!payFromWallet)
                      }}
                    />
                  }
                  label="Pay from wallet"
                />

              </div>

              <RadioGroup aria-label="checkout" name="checkout" value={value} onChange={handleChange} className="d-flex flex-column gap-3">

                <FormControlLabel value="saved_card" control={<Radio />} label="Your saved cards" />

                {
                  value === "saved_card" && <div style={{ background: "#16334008" }} className="p-3 border-radius-2 border">

                    <RadioGroup aria-label="checkout" name="saved_card_details" value={savedCard} onChange={handleChangeSavedCard} className="d-flex flex-column gap-3">

                      <FormControlLabel value="card_1" control={<Radio />} label="Test Card ending in 3521" />

                      {
                        savedCard === "card_1" && <div style={{ background: "white", fontSize: "1rem" }} className="p-3 border-radius-2 border d-flex gap-2 flex-column">
                          <div>Name: Mr. Tom Scott</div>
                          <div>Expire: 03/2029</div>

                          <TextField
                            className="mt-3"
                            required
                            id="cvv"
                            label="CVV"
                            fullWidth
                            autoComplete="cc-csc"
                            variant="outlined"
                            value={cvv}
                            style={{ width: 200 }}
                            InputProps={{
                              inputComponent: CustomFormatCardCVV as any,
                              inputProps: {
                                allowNegative: false,
                                decimalSeparator: '.',
                                displayType: 'input',
                                type: 'text',
                                thousandSeparator: true,
                                placeholder: '123',
                                format: '###',
                                onValueChange: (values: NumberFormatValues) => {
                                  setCvv(values.value);
                                }
                              }
                            }}
                          />

                        </div>
                      }

                      {/* <FormControlLabel value="card_2" control={<Radio />} label="Pay From Wallet" />

                      <FormControlLabel value="card_3" control={<Radio />} label="Pay From Wallet" /> */}

                    </RadioGroup>

                  </div>
                }

                <Divider />

                <FormControlLabel value="new_card" control={<Radio />} label="New card payment" />

                <Grid container style={{ background: "#16334008" }} className="p-3 border-radius-2 border">
                  <Grid item xs={12} sm={6}>
                    <PaymentForm form={form} setForm={setForm} error={error} />
                  </Grid>
                </Grid>

              </RadioGroup>

            </Box>

          </Paper>
        </Container>

      </Grid>

      <Grid item xs={4} className="pr-2">
        <Review totalAmount={totalAmount} cartItems={cartItems} />

        <Divider />

        <Box my={2} className="d-flex flex-column gap-2 font-weight-bold text-success">
          <p>Estimated Delivery</p>
          <p>{displayDate(moment().add(7, "d"))} - {displayDate(moment().add(8, "d"))}</p>
        </Box>

        <Divider />

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

      </Grid>

    </Grid>

  );
};

export default Checkout;
