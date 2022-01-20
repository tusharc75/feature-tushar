import { Box } from '@material-ui/core';
import { useEffect, useContext, useState, Fragment } from 'react';
import axiosInstance from '../../../axios/axiosInstance';
import ECommerceBreadCrumbs from '../../../components/ECommerce/BreadCrumbs/ECommerceBreadCrumbs';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { red } from '@material-ui/core/colors';
import { displayDate } from '../../../constants/helpers';
import { useHistory } from 'react-router-dom';
import routes from '../../../components/Helpers/Routes';

export default function Orders() {

    const toastConfig = useContext(CustomToastContext);
    const [orders, setOrders] = useState([]);
    const history = useHistory();

    useEffect(() => {
        axiosInstance().get("/ecommerce/order").then(({ data: { data } }) => {
            setOrders([...data])
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        })
    }, [])

    return <div className="container">
        <div className="p-2">
            <ECommerceBreadCrumbs routes={[{ title: "Orders" }]} />
        </div>
        <Box className="d-flex flex-column gap-3">
            {
                orders.map((order) => (
                    <Fragment key={order._id}>
                        <Card className="cursor-pointer" onClick={() => {
                            history.push(`${routes.orderDetails.path}/${order._id}`)
                        }}>
                            <CardHeader style={{ background: "color(--lightgrey" }} title={`Order #${order._id}`} subheader={`${displayDate(order.date)}`} />
                            <CardContent>
                                <Typography variant="body2" color="textSecondary" component="p">
                                    {order.items.length} Items Included
                                </Typography>
                            </CardContent>
                        </Card>
                    </Fragment>
                ))
            }

        </Box>
    </div>
}
