import { useState, useEffect, useContext, useReducer } from "react";
import CustomDialogHeader from '../../CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition } from "../../../constants/helpers";
import ProductGridSupplierAskPrice from "./ProductGridSupplierAskPrice";
import AskSupplierPriceDialog from "../AskSupplierPriceDialog";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { withStyles } from '@material-ui/core/styles';
import { Box, Grid, IconButton, Typography } from "@material-ui/core";

const Accordion = withStyles({
    root: {
        border: '1px solid rgba(0, 0, 0, .125)',
        '&:not(:last-child)': {
            borderBottom: 0
        },
        '&:before': {
            display: 'none'
        },
        '&$expanded': {
            margin: 'auto'
        }
    },
    expanded: {}
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: 'white',
        borderBottom: '1px solid #f1ece8',
        background: '#ffffff',
        fontWeight: 'bold',
        padding: '0px',
        '&$expanded': {
            minHeight: 46
        }
    },
    content: {
        '&$expanded': {
            margin: '15px 0'
        }
    },
    expanded: {}
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
    root: {
        padding: theme.spacing(1),
        display: 'block'
    }
}))(MuiAccordionDetails);
const ViewSupplierPriceDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, quoteData, productBuilderId, onSuccess } = props;
    const [productDataList, setproductDataList] = useState([]);
    const [rejectId, setRejectId] = useState(null);
    const [askSupplierPriceDialog, setAskSupplierPriceDialog] = useState(false);
    const [expandSupplierGrid, setExpandSupplierGrid] = useState(0);

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
            onSuccess()
            fetchProductGridData()
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        });
    };

    const handleReject = (content) => {
        axiosInstance().put(`/quote-builder/apply-reject/${rejectId}`, { "body": content ? content : "", "protected": true }).then(({ data }) => {
            toastConfig.setToastConfig({
                message: data?.message,
                type: "success",
                open: true,
            });
            setAskSupplierPriceDialog(false)
            fetchProductGridData()
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
        <CustomDialogHeader title={"View Supplier Quote"} onClose={handleClose} showRequiredLabel={false} ></CustomDialogHeader>
        {productDataList && productDataList.length !== 0 ?
            productDataList.map((data, index) => (

                <Box ml={2} mr={2}>
                    <div className="p-1 modified_style_of_accordion_supplier_ask_price">
                        <Accordion expanded={Boolean(expandSupplierGrid === index)} className="omsAccordian accordSupplierAskPrice">
                            <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                                <Grid container className="pos_rel">
                                    <div className="clicker_div" onClick={() => expandSupplierGrid === index ? setExpandSupplierGrid(null) : setExpandSupplierGrid(index)}></div>
                                    <Grid item xs={12} sm={12} md={12}>
                                        <Box display="flex">
                                            <Box>
                                                <IconButton size="small" onClick={() => expandSupplierGrid === index ? setExpandSupplierGrid(null) : setExpandSupplierGrid(index)}>{expandSupplierGrid === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                                            </Box>
                                            <Box padding="5px">
                                                <Typography variant="subtitle2">
                                                    {data?.supplierAccount?.optionLabel && `Supplier Account : ${data?.supplierAccount?.optionLabel}`}&nbsp;&nbsp;&nbsp;&nbsp; {data?.status && `Status : ${data?.status} `}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </AccordionSummary>
                            <AccordionDetails>
                                {expandSupplierGrid === index && (
                                    <ProductGridSupplierAskPrice
                                        productData={data} handleAdd={handleAdd}
                                        handleReject={(data) => {
                                            setRejectId(data)
                                            setAskSupplierPriceDialog(true)
                                        }} />
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </div>
                </Box>

            ))
            :
            <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={" Thanks for your submission"}>
                No supplier quote
            </h1>}
        {
            askSupplierPriceDialog &&
            <AskSupplierPriceDialog
                setAskSupplierPriceDialog={setAskSupplierPriceDialog}
                askSupplierPriceDialog={askSupplierPriceDialog}
                from="SupplierAskPrice"
                handleReject={handleReject} />
        }
    </Dialog >
    );
}

export default ViewSupplierPriceDialog;
