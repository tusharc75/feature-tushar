import { useState, useEffect, useContext, useReducer } from "react";
import Dialog from '@material-ui/core/Dialog'
import axiosInstance from '../../../axios/axiosInstance'
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import { CustomDialogTransition, dateFormat, dateTimeFormat } from "../../../constants/helpers";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { withStyles } from '@material-ui/core/styles';
import { Box, Button, Grid, IconButton, TextField, Typography, useMediaQuery } from "@material-ui/core";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable from "src/components/CustomReactTable/CustomReactTable";
import NoDataCell from "src/components/Helpers/NoDataCell";
import DeleteButton from "src/components/Helpers/DeleteButton";
import moment from "moment";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";

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
const PriceRequestDialog = (props) => {

    const toastConfig = useContext(CustomToastContext)
    const { handleClose, quoteData, onSuccess, type } = props;
    const [productDataList, setproductDataList] = useState([]);
    const [response, setResponse] = useState({ open: false, type: "", id: "" });
    const [expandSupplierGrid, setExpandSupplierGrid] = useState(0);
    const [comment, setComment] = useState("");

    const handleChange = (event) => {
        setComment(event.target.value.trimStart());
    };
    useEffect(() => {
        fetchProductGridData()
    }, []);

    const columns: any = [
        {
            accessor: 'detail',
            Header: 'Detail',
            Cell: ({ row }) => (
                type === "Customer" ?
                    <p>{row?.original?.productDetail.productName}</p>
                    : <p>{row?.original?.productName ?? row?.original?.serviceName}</p>
            ),
        },
        {
            accessor: 'price',
            Header: 'Price',
            Cell: ({ row }) => (<p className="text-truncate">{row?.original[`price_${quoteData?.currency?.toLowerCase()}`] ? <p>{row?.original[`price_${quoteData?.currency?.toLowerCase()}`]}</p> : <NoDataCell />}</p>),
        },
    ];

    const fetchProductGridData = () => {
        if (type === "Customer") {
            axiosInstance().get(`/quotation/price-request/${quoteData?._id}`).then(({ data: { data } }) => {
                setproductDataList(data)
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        if (type === "Supplier") {
            axiosInstance().get(`/quotation/supplier-price-request/quotation-product-supplier-response/${quoteData?._id}`).then(({ data: { data } }) => {
                setproductDataList(data)
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }

    };

    const handleAccept = (responseId) => {
        if (type === "Customer") {
            axiosInstance().put(`/quotation/price-request/${quoteData?._id}/apply-price/${responseId}`).then(({ data: { data } }) => {
                fetchProductGridData()
                setResponse({ open: false, type: "", id: "" })
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        if (type === "Supplier") {
            axiosInstance().put(`/quotation/supplier-price-request/apply-bulk-supplier-price`, {
                "requestId": responseId,
                "quotationId": quoteData?._id
            }).then(({ data: { data } }) => {
                fetchProductGridData()
                setResponse({ open: false, type: "", id: "" })
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }

    };

    const handleReject = () => {
        if (type === "Customer") {
            axiosInstance().put(`quotation/price-request/${quoteData?._id}/reject-price/${response.id}`, { "responseComment": comment }).then(({ data: { data } }) => {
                fetchProductGridData()
                setResponse({ open: false, type: "", id: "" })
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }

        if (type === "Supplier") {
            axiosInstance().put(`/quotation/supplier-price-request/apply-reject/${quoteData?._id}/${response.id}`, { "body": comment }).then(({ data: { data } }) => {
                fetchProductGridData()
                setResponse({ open: false, type: "", id: "" })
                onSuccess()
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });

        }
    }
    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={`View ${type} Price`} onClose={handleClose} showRequiredLabel={false} ></CustomDialogHeader>
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
                                                    {data?.status && `Status : ${data?.status} `}
                                                </Typography>
                                            </Box>
                                            <Box padding="5px">
                                                <Typography variant="subtitle2">
                                                    {data?.requestDate && `Request Date : ${moment(data?.requestDate).format(dateTimeFormat)} `}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </AccordionSummary>
                            <AccordionDetails>
                                {expandSupplierGrid === index && (
                                    <>
                                        {((type === "Customer" && data?.status === "Request") || (type === "Supplier" && data?.status === "Submit")) && <Grid item xs={12} sm={12} md={12} container justify="flex-end">
                                            <Box ml={1} mt={1} >
                                                <Button size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        handleAccept(data?._id)
                                                    }}
                                                    variant="contained"
                                                >
                                                    Accept</Button>
                                            </Box>
                                            <Box ml={1} mt={1} >
                                                <DeleteButton
                                                    id="detailDeleteButton"
                                                    text={'Reject'}
                                                    onClick={() => { setResponse({ open: true, type: "Reject", id: data?._id }) }}
                                                />
                                            </Box>
                                        </Grid>}
                                        <Box
                                            p="10px"

                                        >
                                            <CustomReactTable
                                                columns={columns}
                                                data={data.material}
                                                onSelect={() => { }}
                                                childrenProperty="subRows"
                                                uniqueKey="_id"
                                                renderedFrom="quotation_product_package"
                                                isClientSideGrid={true}
                                                hideSelection={true}
                                                displayCustomReactTableHeaderOptions={false}
                                                hideExpander={true}
                                            />
                                        </Box>
                                    </>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    </div>
                </Box>

            ))
            :
            <h1 style={{ padding: "10px", display: "flex", justifyContent: "center", color: "#047d1c" }} title={" Thanks for your submission"}>
                No supplier price
            </h1>}
        {response.open && (
            <Dialog
                TransitionComponent={CustomDialogTransition}
                open={true}
                aria-labelledby="customized-dialog-title"
                fullWidth
                maxWidth={"sm"}
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') { }
                }}
            >
                <CustomDialogHeader
                    onClose={() => { setResponse({ open: false, type: "", id: "" }) }}
                    showRequiredLabel={false}
                    title={"Response comment"}></CustomDialogHeader>
                <CustomDialogContent>
                    <Box>
                        <Box pt={3} pb={3}>
                            <Grid container spacing={3} >
                                <Grid item xs={10} sm={11} md={11}>
                                    <TextField
                                        id="outlined-multiline-static"
                                        label="comment"
                                        placeholder={`Add a comment`}
                                        fullWidth
                                        value={comment}
                                        onChange={handleChange}
                                        variant="outlined"
                                        helperText="At least more then 10 character"
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button color="primary" size="small"
                        onClick={() => { setResponse({ open: false, type: "", id: "" }) }}>Cancel</Button>
                    <Button
                        type="button"
                        color="primary"
                        variant="contained" onClick={() => { response.type === "Reject" && handleReject() }}>Save</Button>
                </CustomDialogFooter>
            </Dialog>
        )

        }
    </Dialog >
    );
}

export default PriceRequestDialog;
