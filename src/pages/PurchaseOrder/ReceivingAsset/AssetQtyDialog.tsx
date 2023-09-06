import React, { useContext, useEffect, useState, FC, Fragment } from 'react';
import { Dialog, Button, TextField } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import {
    purchaseOrder
} from '../../../constants/helpers';
import { useData } from '../../../StateProvider/Provider';
import CustomAssetDialog from 'src/pages/ConvertInventory/InventoryToAsset/CustomAssetDialog';
import { isEqual } from 'lodash';

const AssetQtyDialog = ({ purchaseOrderID, onClose, onSuccess, product, purchaseOrderData }) => {
    const [fullScreen, setFullScreen] = useState(true);

    const {
        state: { user }
    }: any = useData();

    const [defaultWareHouse, setDefaultWareHouse] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toastConfig = useContext(CustomToastContext);

    const [assetNumberDialog, setAssetNumberDialog] = useState({ open: false, products: [], receiveDate: null });
    const [assetQty, setAssetQty] = useState()

    useEffect(() => {
        axiosInstance()
            .get(`/sa-formbuilder/lookup?lookupResource=Warehouse`)
            .then(({ data: { data } }) => {
                setDefaultWareHouse(data['Warehouse']?.find((d) => d?.optionValue === purchaseOrderData?.warehouse?.optionValue));
            });
    }, []);

    const handleSubmit = () => {
        console.log(product)
        setAssetNumberDialog({ open: true, products: [{ ...product, product: product.productId, qty: parseInt(assetQty), warehouse: defaultWareHouse }], receiveDate: null })
    };

    const handleReceive = (products) => {
        console.log(products)
        setIsSubmitting(true);
        axiosInstance()
            .post(`${purchaseOrder.api}/add-assets/${purchaseOrderID}`, { products: products })
            .then(({ data }) => {
                setIsSubmitting(false);
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                setAssetNumberDialog({ open: false, products: [], receiveDate: null })
                onSuccess();
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                setIsSubmitting(false);
            });
    }


    return (
        <>
            <Dialog
                open
                fullScreen={fullScreen}
                maxWidth="md"
                fullWidth
                onClose={(e, reason) => {
                    if (reason !== 'backdropClick') {
                        onClose();
                    }
                }}
            >
                <CustomDialogHeader
                    title={'Add Assets'}
                    onClose={onClose}
                    isMinimized={!fullScreen}
                    onMinimizeMaximize={() => {
                        setFullScreen((prevState) => !prevState);
                    }}
                    showManimizeMaximize={true}
                ></CustomDialogHeader>
                <CustomDialogContent>
                    <TextField
                        fullWidth
                        label="Asset Qty"
                        variant="outlined"
                        type="number"
                        size="small"
                        name="assetQty"
                        placeholder="Asset Qty"
                        value={assetQty}
                        onChange={(e: any) => {
                            console.log(e.target.value)
                            setAssetQty(e.target.value)
                        }}
                        error={(assetQty || 0) > (product.qty - product.actualReceived
                        ) ? true : false}
                        helperText={(assetQty || 0) > (product.qty - product.actualReceived
                        ) ? "Asset Qty can't be greater than remaining qty" : null}
                    />
                </CustomDialogContent>
                <CustomDialogFooter>
                    <Button variant="outlined" disabled={isSubmitting} size="small" color="primary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            handleSubmit();
                        }}
                        size="small"
                        variant="contained"
                        disabled={isSubmitting || (assetQty || 0) > (product.qty - product.actualReceived
                        )}
                        color="primary"
                    >
                        Save
                    </Button>
                </CustomDialogFooter>

            </Dialog>
            {assetNumberDialog.open && (
                <CustomAssetDialog
                    handleClose={() => setAssetNumberDialog({ open: false, products: [], receiveDate: null })}
                    products={[...assetNumberDialog.products]?.map((e: any) => { return { ...e, id: e._id, productName: product?.productName } })}
                    handleSuccess={(rows) => {
                        const products = assetNumberDialog.products;
                        products?.forEach((e) => {
                            e.assetNumbers = rows?.find((ele) => isEqual(ele._id, e.id))?.assetNumbers || []
                        })
                        handleReceive(products)
                    }}
                    loading={isSubmitting}
                />
            )}
        </>
    );
};

export default AssetQtyDialog;
