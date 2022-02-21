
import { Link } from 'react-router-dom'
import { isObjectEmpty, gridLoadingTimeout, deliveryTicket, DELIVERY_FROM_TO_TYPE } from '../../constants/helpers';
import routes from './../../components/Helpers/Routes';


export const PickupFromRenderer = (params) => (
    <Link className="link text-truncate"
        title={params.value}
        to={params?.data?.pickupFromType === DELIVERY_FROM_TO_TYPE.plant ? `${routes.warehouseDetail.path}/${params.data.pickupFromId}` :
            params?.data?.pickupFromType === DELIVERY_FROM_TO_TYPE.customer ? `${routes.customerAccountDetail.path}/${params.data.pickupFromId}` :
                `${routes.supplierAccountDetail.path}/${params.data.pickupFromId}`}>
        {params.value}
    </Link>
);

export const DeliveryToRenderer = (params) => (
    <Link className="link text-truncate"
        title={params.value}
        to={params?.data?.deliveryToType === DELIVERY_FROM_TO_TYPE.plant ? `${routes.warehouseDetail.path}/${params.data.deliveryToId}` :
            params?.data?.deliveryToType === DELIVERY_FROM_TO_TYPE.customer ? `${routes.customerAccountDetail.path}/${params.data.deliveryToId}` :
                `${routes.supplierAccountDetail.path}/${params.data.deliveryToId}`}>
        {params.value}
    </Link>
);
