import { Box, Typography, Paper, Container } from '@material-ui/core';
import React, { useEffect, useContext, useState } from 'react';
import axiosInstance from '../../../axios/axiosInstance';
import ECommerceBreadCrumbs from '../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs';
import routes from '../../../components/Helpers/Routes';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useParams } from "react-router-dom";
import Review from '../Checkout/Review';
import { formatAmountWithCurrency } from '../../../constants/helpers';

export default function OrderDetails() {

    const toastConfig = useContext(CustomToastContext);
    const [order, setOrder] = useState(null);
    const [totalAmount, setTotalAmount] = useState('');
    const [cartItems, setCartItems] = useState([]);

    const { id } = useParams();

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
    }, [])

    return <Container component="main" maxWidth="sm" style={{ marginBottom: 32, marginTop: 40 }}>
        <div className="p-2">
            <ECommerceBreadCrumbs routes={[routes.orders, { title: id }]} />
        </div>

        <Paper style={{ padding: '24px 16px' }}>
            <Typography component="h1" variant="h4" align="center">
                Order #{id}
            </Typography>
            <Box mt={2}>
                <Box my={2}>
                    {
                        order && <Review totalAmount={totalAmount} cartItems={cartItems} />
                    }
                </Box>
            </Box>
        </Paper>

        <br />

        <Paper style={{ padding: '24px 16px' }}>
            <Typography component="h1" variant="h4" align="center">
                Billing Address
            </Typography>
            <Box mt={2}>
                <Typography component="h5" variant="h6">
                    {order?.billingAddress?.fullAddress}
                </Typography>
                <Typography component="h5" variant="h6">
                    {order?.billingAddress?.streetAddress}
                </Typography>
                <Typography component="h5" variant="h6">
                    {order?.billingAddress?.city}
                </Typography>
            </Box>
        </Paper>

        <br />

        <Paper style={{ padding: '24px 16px' }}>
            <Typography component="h1" variant="h4" align="center">
                Shipping Address
            </Typography>
            <Box mt={2}>
                <Typography component="h5" variant="h6">
                    {order?.shippingAddress?.fullAddress}
                </Typography>
                <Typography component="h5" variant="h6">
                    {order?.shippingAddress?.streetAddress}
                </Typography>
                <Typography component="h5" variant="h6">
                    {order?.shippingAddress?.city}
                </Typography>
            </Box>
        </Paper>
    </Container>
    // <div className="container">
    //     <div className="p-2">
    //         <ECommerceBreadCrumbs routes={[routes.orderDetails, { title: order?._id }]} />
    //     </div>
    //     <Box>


    //     </Box>
    // </div>
}
