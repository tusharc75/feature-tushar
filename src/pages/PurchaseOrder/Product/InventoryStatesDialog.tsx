import { Box, Dialog, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomDialogTransition, purchaseOrder } from 'src/constants/helpers';

const InventoryStatesDialog = ({ open, onClose, product, warehouse }) => {
    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [inventoryData, setInventoryData] = useState(null);

    useEffect(() => {
        axiosInstance().get(`${purchaseOrder.api}/product-stat?product=${product}&warehouse=${warehouse}`).then(({ data: { data } }) => {
            setInventoryData(data)
        })
    }, []);

    return (
        <Dialog
            maxWidth="md"
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={open}
            fullWidth
        >
            <CustomDialogHeader
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                    setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
                showRequiredLabel={false}
                title={"Inventory States"}
                onClose={onClose}
            />
            <CustomDialogContent>
                <div className="p-3">
                    {inventoryData ?
                        <TableContainer component={Paper}>
                            <Table aria-label="customized table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Warehouse</TableCell>
                                        <TableCell>Inventory</TableCell>
                                        <TableCell>Average price</TableCell>
                                        <TableCell>Total Amount</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {inventoryData &&
                                        inventoryData?.map((item: any, index: any) => (
                                            <TableRow key={index}>
                                                <TableCell>{item?.warehouse?.optionLabel}</TableCell>
                                                <TableCell>{item?.qty}</TableCell>
                                                <TableCell>{item?.price}</TableCell>
                                                <TableCell>{item?.qty * item?.price}</TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        : <Box
                            p={2}
                            height={500}
                            bgcolor="white">
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>}
                </div>
            </CustomDialogContent>
        </Dialog>
    );
};

export default InventoryStatesDialog;
