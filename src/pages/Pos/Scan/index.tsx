import React, { useEffect, useContext, useState, Fragment } from 'react';
import { Box, Button, capitalize, Chip, Dialog, Divider, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom'
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import { CustomDialogTransition } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import BarcodeScannerComponent from "react-qr-barcode-scanner";



export default function Scan({ onClose, plantId, handleAddToCart }) {

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    const [scanResult, setScanResult] = useState({ open: false, result: null })
    const [searchText, setSearchText] = useState(null)

    const closeDialog = () => {
        setScanResult({ open: false, result: null })
    }


    const fetchProduct = (barcode) => {
        const updatedFilters = [];
        updatedFilters.push({
            field: "barcode",
            term: barcode
        });
        const deepFilter = `&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
        axiosInstance().get(`/pos?wareHouse=${plantId}${deepFilter}`).then(({ data: { data, count } }) => {
            if (data?.length === 1) {
                handleAddToCart(data)
            }
            else if (data?.length) {
                setScanResult({ open: true, result: data })
            }
        }).catch((error) => {
            toastConfig.setToastConfig(error);
        })
    }

    return (<Fragment>
        <Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`Scan`} showRequiredLabel={false} onClose={onClose} ></CustomDialogHeader>
            <BarcodeScannerComponent
                width="100%"
                height="100%"
                onUpdate={(err, result: any) => {
                    if (result && result?.text && result?.text !== searchText) {
                        setSearchText(result?.text)
                        fetchProduct(result?.text)
                    }
                }}
            />
        </Dialog>
        {scanResult.open &&
            <Dialog
                open
                fullWidth
                maxWidth="sm"
                onClose={closeDialog}
                fullScreen={false}
                TransitionComponent={CustomDialogTransition}
            >
                <CustomDialogHeader
                    title="Scanned Result"
                    onClose={closeDialog}
                    showRequiredLabel={false}
                    showManimizeMaximize={false}
                />
                <CustomDialogContent>
                    {scanResult?.result?.length > 0 ?
                        <List>
                            {scanResult?.result?.map((m) => (
                                <Fragment key={m._id}>
                                    <ListItem alignItems="flex-start">
                                        <ListItemAvatar className="mr-3">
                                            <Avatar variant="rounded" style={{ height: 80, width: 80 }}>
                                                {m.productImage ?
                                                    <img src={m.productImage} alt={m.productName} loading="lazy" className="w-100" /> : <ImageIcon />
                                                }
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={m.productName} />
                                    </ListItem>
                                    <Divider />
                                </Fragment>
                            ))
                            }
                        </List> : <h2 className="my-3">No Products Found...</h2>
                    }
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" color="primary" onClick={closeDialog}>
                        Close
                    </Button>
                </CustomDialogFooter>
            </Dialog>
        }
    </Fragment >)


}
