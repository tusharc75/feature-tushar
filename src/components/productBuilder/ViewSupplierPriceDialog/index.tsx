import { useState, useEffect, useContext, useReducer } from "react";
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition } from "../../../constants/helpers";
import ProductGridSupplierAskPrice from "./ProductGridSupplierAskPrice";
import AskSupplierPriceDialog from "../AskSupplierPriceDialog";

const ViewSupplierPriceDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, quoteData, productBuilderId, onSuccess } = props;
    const [productDataList, setproductDataList] = useState([]);
    const [rejectId, setRejectId] = useState(null);
    const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);

    useEffect(() => {
        fetchProductGridData()
    }, []);

    const fetchProductGridData = () => {

        axiosInstance().get(`/quote-builder/quote-product-supplier-response/${quoteData?._id}/${productBuilderId}`).then(({ data: { data } }) => {
            setproductDataList(data)
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleAdd = (requestId) => {

        axiosInstance().put(`/quote-builder/apply-bulk-supplier-price`, { "requestId": requestId }).then(({ data: { data } }) => {
            handleClose()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleReject = (content) => {
        axiosInstance().put(`/quote-builder/apply-reject/${rejectId}`, { "body": content ? content : "" }).then(({ data }) => {
            toastConfig.setToastConfig({
                message: data?.message,
                type: "success",
                open: true,
            });
            setAskSupplierPriceDialog(false)
        })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            });
    }
    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={"View Supplier Price"} onClose={handleClose} ></CustomDialogHeader>
        {productDataList && productDataList.map(data => (
            <ProductGridSupplierAskPrice
                productData={data} handleAdd={handleAdd}
                handleReject={(data) => {
                    setRejectId(data)
                    setAskSupplierPriceDialog(true)
                }} />
        ))}
        {askSupplierPriceDialog &&
            <AskSupplierPriceDialog
                setAskSupplierPriceDialog={setAskSupplierPriceDialog}
                askSupplierPriceDialog={askSupplierPriceDialog}
                from="SupplierAskPrice"
                handleReject={handleReject} />
        }
    </Dialog>
    );
}

export default ViewSupplierPriceDialog;
