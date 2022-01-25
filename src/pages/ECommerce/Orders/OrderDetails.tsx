import { Container, Paper, Typography, Box, Grid, Divider } from '@material-ui/core';
import { useLocation, useHistory, useParams } from 'react-router-dom';
import { parse } from 'query-string';
import Loader from '../../../components/Loader';
import routes from '../../../components/Helpers/Routes';
import axiosInstance from '../../../axios/axiosInstance';
import { formatAmountWithCurrency } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useContext, useState, useEffect } from 'react';
import ECommerceBreadCrumbs from '../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs';
import Review from '../Checkout/Review';
import MuiAlert from '@material-ui/lab/Alert';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const getIcon = (status: string) => {
    switch (status) {
        case 'success': {
            return (
                <Alert severity="success">
                    Thank you, your order was placed successfully
                </Alert>
            );
        }
        case 'failed': {
            return (
                <Alert severity="error">
                    Sorry, your order couldn't be placed
                </Alert>
            );
        }
        default:
            return;
    }
};

const statuses = ['success', 'failed'];

export default function OrderDetails() {

    const location = useLocation();
    const history = useHistory();

    const { id } = useParams();

    const { status }: any = parse(location.search);
    const toastConfig = useContext(CustomToastContext);

    const [order, setOrder] = useState(null);
    const [totalAmount, setTotalAmount] = useState('');
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        axiosInstance().get(`/ecommerce/order/${id}`).then(({ data: { data } }) => {
            setOrder(data)
            setCartItems(
                data.products.map((d: any) => ({
                    ...d,
                    formattedAmount: formatAmountWithCurrency(d?.currency, d.rate)?.fullFormatAmount,
                    itemName: d.productName
                }))
            );
            if (data.products.length > 0) {
                const tempTotalPrice = data.products.reduce((acc: any, curr: any) => {
                    return acc + curr.qty * curr.rate;
                }, 0);
                setTotalAmount(formatAmountWithCurrency(data.products[0].currency, tempTotalPrice)?.fullFormatAmount);
            } else {
                setTotalAmount('');
            }

        }).catch((error) => {
            toastConfig.setToastConfig(error);
        })
    }, [id])

    // if (!status || !statuses.includes(status)) return <Loader noLoader text={'Nothing is here'} minHeight={'100%'} />;

    return (
        <Container component="main" style={{ marginBottom: 32 }}>

            <div className="p-2">
                <ECommerceBreadCrumbs routes={[routes.orders, { title: order?.name }]} />
            </div>

            <Grid container className="mt-3 d-flex gap-3">

                <Grid item xs={12}>
                    {getIcon(status)}
                </Grid>

                <Grid item xs={12}>

                    <Paper style={{ padding: '24px 16px' }}>
                        <Typography component="h2" variant="h5" align="center">
                            Order Id : {order?.name}
                        </Typography>

                        <Divider className="my-2" />

                        <Box mt={2}>
                            <Box my={2}>
                                {
                                    order && <Review totalAmount={totalAmount} cartItems={cartItems} />
                                }
                            </Box>
                        </Box>
                    </Paper>

                </Grid>

            </Grid>

            <Grid container className="mt-3" spacing={2}>

                <Grid item xs={6}>

                    <Paper style={{ padding: '24px 16px' }}>
                        <Typography component="h2" variant="h5" align="center" className="pt-0">
                            Billing Address
                        </Typography>

                        <Divider className="my-2" />

                        <Box mt={2}>
                            <Typography variant="subtitle1">
                                {order?.billingAddress?.fullAddress}
                            </Typography>
                            <Typography variant="subtitle1">
                                {order?.billingAddress?.streetAddress}
                            </Typography>
                            <Typography variant="subtitle1">
                                {order?.billingAddress?.city}
                            </Typography>
                        </Box>
                    </Paper>

                </Grid>

                <Grid item xs={6}>

                    <Paper style={{ padding: '24px 16px' }}>
                        <Typography component="h2" variant="h5" align="center" className="pt-0">
                            Shipping Address
                        </Typography>

                        <Divider className="my-2" />

                        <Box mt={2}>
                            <Typography variant="subtitle1">
                                {order?.shippingAddress?.fullAddress}
                            </Typography>
                            <Typography variant="subtitle1">
                                {order?.shippingAddress?.streetAddress}
                            </Typography>
                            <Typography variant="subtitle1">
                                {order?.shippingAddress?.city}
                            </Typography>
                        </Box>
                    </Paper>

                </Grid>

            </Grid>

        </Container>

    );
}
