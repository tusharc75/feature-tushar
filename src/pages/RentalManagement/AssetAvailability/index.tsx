import React, { useContext, useEffect, useState } from "react";
import { Dialog, IconButton, Typography } from "@material-ui/core";
import axiosInstance from "src/axios/axiosInstance";
import { CustomDialogTransition } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CloseIcon from '@material-ui/icons/Close';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';

const typographyh = {
    fontSize: '13px',
    fontWeight: 600
}
const typographyd = {
    fontSize: '13px',
}

export default function AssetAvailability({ rentalId, handleAssetAvailabilityClose }) {

    const toastConfig = useContext(CustomToastContext);

    const [asset, setAsset] = useState([])
    const [availableAssets, setAvailableAssets] = useState([])

    useEffect(() => {
        axiosInstance().get(`/rental-management/automation/check-asset-availability/${rentalId}`)
            .then((data: { data }) => {
                const assets = data?.data?.data;
                assets.map((_asset) => {
                    if (_asset?.availableAssets >= _asset?.qty) {
                        setAvailableAssets([...availableAssets, _asset])
                    } else {
                        setAsset([...asset, _asset])
                    }
                })
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
            })
    }, [rentalId])

    return (
        <Dialog fullScreen={false} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
            <div className="listing-grid" style={{ height: '100%' }}>
                <div className="p-4">
                    <div className="d-flex justify-content-space-between align-items-center pb-3" style={{ borderBottom: '1px solid #dddddd' }}>
                        <div className="d-flex align-items-center">
                            {
                                asset?.length > 0
                                    ?
                                    <>
                                        <ErrorIcon color="error" />
                                        <Typography className="ml-2" style={{ fontSize: '14px', fontWeight: 600 }}>Serialized Assets not Available</Typography>
                                    </>
                                    :
                                    <>
                                        {
                                            (availableAssets?.length > 0 && asset?.length === 0) &&
                                            <>
                                                <CheckCircleIcon color="secondary" />
                                                <Typography className="ml-2" style={{ fontSize: '14px', fontWeight: 600 }}>Serialized Assets Available</Typography>
                                            </>
                                        }
                                    </>
                            }
                        </div>
                        <IconButton size="small" aria-label="Details" onClick={handleAssetAvailabilityClose}>
                            <CloseIcon color={'primary'} fontSize="small" />
                        </IconButton>
                    </div>
                    <div className="mt-4">
                        {
                            asset?.length > 0 ?
                                <>
                                    <Typography style={{ fontSize: '13px' }}>Serialized Assets are not available for following products</Typography>
                                    <div className="mt-4">
                                        {
                                            asset?.map((_asset) => {
                                                return (
                                                    <div className="d-flex pt-2 pb-2 pl-3 pr-3 mt-3" style={{ border: '1px solid black', borderRadius: '10px' }}>
                                                        <div>
                                                            <Typography style={typographyh}>Product Name</Typography>
                                                            <Typography style={typographyd}>{_asset?.product?.productName}</Typography>
                                                        </div>
                                                        <div className="ml-4">
                                                            <Typography style={typographyh}>Qty</Typography>
                                                            <Typography style={typographyd}>{_asset?.qty}</Typography>
                                                        </div>
                                                        <div className="ml-4">
                                                            <Typography style={typographyh}>Asset Status</Typography>
                                                            <Typography style={typographyd}>{_asset?.availableAssets}</Typography>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </>
                                :
                                <>
                                    {
                                        (availableAssets?.length > 0 && asset?.length === 0) &&
                                        <Typography style={{ fontSize: '13px' }}>Serialized Assets are available for all the products</Typography>
                                    }
                                </>
                        }
                    </div>

                </div>
            </div>
        </Dialog>
    )
}