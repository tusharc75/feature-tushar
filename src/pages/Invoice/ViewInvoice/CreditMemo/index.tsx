import { Box, Button, IconButton } from '@material-ui/core';
import { camelCase, startCase } from 'lodash';
import React, { Fragment, useContext, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { fetch_invoice_product_fields } from 'src/components/Invoice/helper';
import { generateCustomTableColumns } from 'src/constants/columns';
import { CHILD_RESOURCE, invoice } from 'src/constants/helpers';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { Add } from '@material-ui/icons';
import ManageCreditMemoDialog from './ManageCreditMemo';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';


function CreditMemo({ invoiceData }) {

    const toastConfig = useContext(CustomToastContext);
    const renderedFrom = `${camelCase(routes?.invoice.title)}_view_credit_memo`;

    const [columns, setColumns] = useState(null);
    const [rowsData, setRowsData] = useState(null);
    const [createCreditMemoDialog, setCreateCreditMemoDialog] = useState(false);


    useEffect(() => {
        fetchFields();
        fetchData();
    }, []);

    const fetchFields = async () => {
        try {
            let data = [];
            const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.invoiceCreditMemo}`);
            data = response?.data?.data;
            data = CURReplaceByCurrencySingle(data, invoiceData?.currency || 'USD');
            const newColumns = generateCustomTableColumns(data, invoiceData?.currency, renderedFrom);
            newColumns.push({
                Header: 'Action',
                accessor: '_id',
                Cell: ({ row, rows }) => (
                    <HtmlTooltip title={'Delete'}>
                        <IconButton
                            size="small"
                            aria-label="Details"
                            onClick={() => {
                                remove([row.original._id]);
                            }}
                        >
                            <DeleteIcon fontSize="small" color={'error'} />
                        </IconButton>
                    </HtmlTooltip>
                ),
            })
            setColumns([...newColumns]);
            fetchData();
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };

    const fetchData = async () => {
        var data: any = [];
        const response = await axiosInstance().get(`${invoice.api}/credit-memo/${invoiceData._id}`);
        data = response?.data?.data || [];
        setRowsData(data);
    };

    const remove = async (ids) => {
        try {
            await axiosInstance().put(`${invoice.api}/credit-memo/${invoiceData._id}/delete`, {
                ids: [...ids],
            });
            toastConfig.setToastConfig({
                open: true,
                message: 'Credit Memo Deleted Successfully',
                severity: 'success',
            });
            fetchData();
        } catch (error) {
            toastConfig.setToastConfig(error);
        }
    };
    return (
        <Fragment>
            <div style={{ display: "flex", justifyContent: "space-between" }} className='mb-2'>
                <Box />
                <Button
                    variant={'outlined'} color="primary" size="small" startIcon={<Add />}
                    onClick={() => setCreateCreditMemoDialog(true)}
                >
                    Create
                </Button>
            </div>
            {columns && rowsData ? (
                <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} pt={1}>
                    <CustomReactTable
                        height={'calc(100vh - 200px)'}
                        columns={columns}
                        data={rowsData}
                        onSelect={() => { }}
                        childrenProperty="subRows"
                        uniqueKey="_id"
                        hideSelection={true}
                        hideAction={false}
                        renderedFrom={renderedFrom}
                        isClientSideGrid={true}
                        hideExpander={true}
                    />
                </Box>
            ) : (
                <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
            )}
            {
                createCreditMemoDialog && (
                    <ManageCreditMemoDialog
                        invoiceData={invoiceData}
                        onClose={() => setCreateCreditMemoDialog(false)}
                        open={createCreditMemoDialog}
                        onSuccess={() => {
                            setCreateCreditMemoDialog(false);
                            fetchData();
                        }}
                    />
                )
            }
        </Fragment>
    )
}

export default CreditMemo