import React, { useEffect, useState } from 'react';
import { isMobile, isTablet } from "react-device-detect";
import { Button, Dialog, Grid, Box, IconButton } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';


const DispatchMaterial = ({ handleClose, data, handleSubmit }) => {

    const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [rowsData, setRowsData] = useState(null);

    useEffect(() => {
        if (data?.length) {
            const rows: any = [];
            data[0].material?.forEach((e) => {
                const obj: any = {};
                obj._id = e._id;
                obj.detail = e?.productDetail?.productName;
                obj.productId = e?.productDetail?._id;
                obj.type = "Product";
                obj.qty = e?.qty;
                rows.push(obj);
            })
            setRowsData(rows)
        }
    }, [data]);

    const columns: any = [{
        accessor: 'type',
        Header: 'Type',
        width: 150,
        Cell: ({ row }) => {
            return row.original['type'] ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
        }
    },
    {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {row.original?.detail}
                <IconButton
                    size="small"
                    style={{ marginLeft: "10px" }}
                    onClick={() => {
                        window.open(`${routes.productDetail.path}/${row.original?.productId}`);
                    }}
                >
                    <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
            </div>
        )
    },
    {
        accessor: 'qty',
        Header: 'Qty',
        width: 200,
        Cell: ({ row }) => {
            return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        }
    }];

    return (<Dialog
        maxWidth="md"
        fullScreen={fullScreen || (isMobile || isTablet)}
        aria-labelledby="customized-dialog-title"
        open={true}
        fullWidth
    >
        <CustomDialogHeader
            title={"Dispatch"}
            onClose={handleClose}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
            }}
            showManimizeMaximize={true}
        ></CustomDialogHeader>
        <CustomDialogContent>
            {rowsData &&
                <CustomReactTable
                    columns={columns}
                    data={rowsData}
                    onSelect={setSelectedRecords}
                    childrenProperty="subRows"
                    uniqueKey="_id"
                    hideAction={true}
                    renderedFrom={`product_dispatch_technician`}
                    isClientSideGrid={true}
                    hideExpander={true}
                />
            }
        </CustomDialogContent>
        <CustomDialogFooter>
            <Button
                size="small"
                color="primary"
                onClick={handleClose}
            >{"Cancel"}</Button>
            <CustomButton
                loading={false}
                variant="contained"
                color="primary"
                type="submit"
                onClick={() => {   
                    handleSubmit([{ ...data[0], material: selectedRecords?.map((e) => { return { _id: e._id, type: "product", product: e.productId } }) }])
                }}
            > Dispatch
            </CustomButton>
        </CustomDialogFooter>
    </Dialog>
    );
};

export default DispatchMaterial;
