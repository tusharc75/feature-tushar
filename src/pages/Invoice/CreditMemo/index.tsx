import { Box, Button, IconButton } from '@material-ui/core';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react'
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { generateCustomTableColumns } from 'src/constants/columns';
import { CHILD_RESOURCE, invoice } from 'src/constants/helpers';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { Add } from '@material-ui/icons';
import ManageCreditMemoDialog from './ManageCreditMemo';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';


function CreditMemo({ invoiceData }) {

    const toastConfig = useContext(CustomToastContext);
    const renderedFrom = `${camelCase(routes?.invoice.title)}_credit_memo`;

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
                accessor: 'action',
                Header: 'Actions',
                minWidth: 100,
                width: 100,
                sticky: 'right',
                disableFilters: true,
                canDrag: false,
                Cell: ({ row, rows }) =>
                    <>
                        <HtmlTooltip title={'Edit'}>
                            <IconButton
                                size="small"
                                aria-label="Delete"
                                onClick={() => {

                                }}
                            >
                                <EditIcon fontSize="small" color={'primary'} />
                            </IconButton>
                        </HtmlTooltip>
                        <IconButton
                            size="small"
                            aria-label="Details"
                            onClick={() => {
                                handleDelete([row.original._id]);
                            }}
                        >
                            <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                    </>
            });
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

    const handleDelete = async (ids) => {
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
            <Box pb={2}>
                <Button
                    variant={'outlined'}
                    color="primary"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setCreateCreditMemoDialog(true)}
                >
                    Create
                </Button>
            </Box>
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
            {createCreditMemoDialog && (
                <ManageCreditMemoDialog
                    invoiceData={invoiceData}
                    onClose={() => setCreateCreditMemoDialog(false)}
                    open={createCreditMemoDialog}
                    onSuccess={() => {
                        setCreateCreditMemoDialog(false);
                        fetchData();
                    }}
                />
            )}
        </Fragment>
    )
}

export default CreditMemo