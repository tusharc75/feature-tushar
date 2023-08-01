import { Box, Button, Grid, IconButton } from '@material-ui/core';
import { camelCase, capitalize, set } from 'lodash';
import React, { useContext, useEffect, useState } from 'react'
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import AssignProductCategoryDialog from 'src/components/AssignRolesDialog/AssignProductCategoryDialog';




function SupplierItems({ api, id, allowedToEdit }) {

    const toastConfig = useContext(CustomToastContext);
    const { isOffline } = useContext(CustomOfflineContext);


    const renderForm = camelCase(routes?.supplierAccount?.title + '_supplierItems');
    const [tabValue, setTabValue] = useState(0);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [dataRows, setDataRows] = useState([]);
    const [pCategoryRows, setPCategoryRows] = useState(null)
    const [pRows, setPRows] = useState(null)
    const [aRows, setARows] = useState(null)
    const [columns, setColumns] = useState(null);
    const [assignDialog, setAssignDialog] = useState({ open: false, type: null, data: null })

    useEffect(() => {
        fetchFields()
        fetchData()
    }, [id])

    const fetchData = async () => {
        const res = await axiosInstance().get(`${api}/items/${id}/`)

        const data = res?.data?.data?.map((item) => {
            return {
                ...item,
                detail: item?.productName || item?.assetNumber || item?.name || item?.categoryDescription,
            }
        })

        const pCategoryData = data?.filter((item) => item.type === 'productCategory')
        const pData = data?.filter((item) => item.type === 'product')
        const aData = data?.filter((item) => item.type === 'serializedAsset')

        setPCategoryRows(pCategoryData || [])
        setPRows(pData || [])
        setARows(aData || [])

        console.log(res, pCategoryData, pData, aData)
    }


    const fetchFields = async () => {
        const column: any = [
            {
                accessor: 'Type',
                Header: 'type',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['type'] ? <p className="text-truncate">{capitalize(row.original['type'] === 'productCategory' ? 'Product Category' : row.original['type'] === 'product' ? 'Product' : 'Asset')}</p> : <NoDataCell />;
                }
            },
            {
                accessor: 'Detail',
                Header: 'detail',
                width: 200,
                Cell: ({ row }) => {
                    return row.original['detail'] ? <div style={{ display: 'flex', alignItems: 'center' }}>
                        <p className="text-truncate">{row.original['detail']}</p>
                        {
                            !isOffline && (
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (row.original.type === 'product') {
                                            window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                                        } else if (row.original.type === 'serializedAsset') {
                                            window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                                        } else {
                                            window.open(`${routes.productCategoryDetail.path}/${row.original.materialId}`);
                                        }
                                    }}
                                >
                                    <OpenInNewIcon fontSize="small" color="primary" />
                                </IconButton>
                            )
                        }
                    </div>
                        : <NoDataCell />;
                }
            }
        ]

        column.push({
            accessor: 'action',
            Header: 'Actions',
            minWidth: 50,
            width: 50,
            sticky: 'right',
            disableFilters: true,
            canDrag: false,
            Cell: ({ row, rows }) => {
                return (
                    <>
                        <HtmlTooltip title={'Delete'}>
                            <span>
                                <IconButton
                                    size="small"
                                    aria-label="Details"
                                    onClick={() => {
                                        deleteItems([row.original])
                                    }}
                                >
                                    <DeleteIcon fontSize="small" color={'error'} />
                                </IconButton>
                            </span>
                        </HtmlTooltip>

                    </>
                )
            }
        });
        setColumns(column)
    }

    const deleteItems = async (values) => {
        const ids = values?.map((item) => item.materialId)
        axiosInstance().put(`${api}/items/${id}/delete`, { ids: ids }).then((res) => {
            fetchData();
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: 'Deleted Successfully'
            });
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        })
    }

    const assignItems = async (values) => {
        axiosInstance().put(`${api}/items/${id}/assign`, { items: values }).then((res) => {
            fetchData();
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: 'Assigned Successfully'
            });
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        })
    }


    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <>
            <CustomTabs value={tabValue} onChange={handleMainTabChange} style={{ marginBottom: -1 }}>
                <CustomTab index={0} label={'Product Category'} value={0} primaryColor={true} />
                <CustomTab index={1} label={'Products'} value={1} primaryColor={true} />
                <CustomTab index={2} label={'Assets'} value={2} primaryColor={true} />
            </CustomTabs>
            <Box className="container-with-border" p={2} paddingTop={0} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                <Box display="flex" padding={2} flexWrap={'wrap'}>
                    <Button variant="outlined" color="primary" size="small"
                        onClick={() => {
                            if (tabValue === 0) {
                                setAssignDialog({ open: true, type: 'productCategory', data: pCategoryRows })
                            } else if (tabValue === 1) {
                                setAssignDialog({ open: true, type: 'product', data: pRows })
                            } else {
                                setAssignDialog({ open: true, type: 'serializedAsset', data: aRows })
                            }
                        }}
                    >
                        Add {tabValue === 0 ? 'Product Category' : tabValue === 1 ? 'Product' : 'Asset'}
                    </Button>
                </Box>
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12} sm={12}>
                            {columns && pCategoryRows ? (
                                <CustomReactTable
                                    height={'calc(100vh - 440px)'}
                                    columns={columns}
                                    data={pCategoryRows}
                                    onSelect={setSelectedRecords}
                                    childrenProperty="subRows"
                                    uniqueKey="_id"
                                    renderedFrom={renderForm}
                                    isClientSideGrid={true}
                                    hideExpander={true}
                                    hideSelection={!allowedToEdit}
                                    hideAction={!allowedToEdit}
                                />
                            ) : (
                                <Box p={2} height={500}>
                                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12} sm={12}>
                            {columns && pRows ? (
                                <CustomReactTable
                                    height={'calc(100vh - 440px)'}
                                    columns={columns}
                                    data={pRows}
                                    onSelect={setSelectedRecords}
                                    childrenProperty="subRows"
                                    uniqueKey="_id"
                                    renderedFrom={renderForm}
                                    isClientSideGrid={true}
                                    hideExpander={true}
                                    hideSelection={!allowedToEdit}
                                    hideAction={!allowedToEdit}
                                />
                            ) : (
                                <Box p={2} height={500}>
                                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12} sm={12}>
                            {columns && aRows ? (
                                <CustomReactTable
                                    height={'calc(100vh - 440px)'}
                                    columns={columns}
                                    data={aRows}
                                    onSelect={setSelectedRecords}
                                    childrenProperty="subRows"
                                    uniqueKey="_id"
                                    renderedFrom={renderForm}
                                    isClientSideGrid={true}
                                    hideExpander={true}
                                    hideSelection={!allowedToEdit}
                                    hideAction={!allowedToEdit}
                                />
                            ) : (
                                <Box p={2} height={500}>
                                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </TabPanel>
                {
                    assignDialog.open && assignDialog.type === 'product' && (
                        <AssignProductDialog
                            productsDialogOpen={assignDialog.open}
                            productId={null}
                            assignedProducts={assignDialog?.data?.map((item) => item.materialId) || []}
                            reference='supplier'
                            handleCloseDialog={() =>
                                setAssignDialog({ open: false, type: null, data: null })}
                            onSuccess={(data) => {
                                const assignData = data?.map((item) => {
                                    return {
                                        type: assignDialog.type,
                                        materialId: item.id,
                                    }
                                })
                                assignItems(assignData)
                            }}
                        />
                    )
                }
                {
                    assignDialog.open && assignDialog.type === 'serializedAsset' && (
                        <AssignSerializedAssetDialog
                            reference={'supplier'}
                            referenceData={null}
                            ids={assignDialog?.data?.map((item) => item.materialId) || []}
                            isAssigning={false}
                            handleClose={() =>
                                setAssignDialog({ open: false, type: null, data: null })}
                            handleSucess={(data) => {
                                const assignData = data?.map((item) => {
                                    return {
                                        type: assignDialog.type,
                                        materialId: item.id,
                                    }
                                })
                                assignItems(assignData)
                            }}
                        />
                    )
                }
                {
                    assignDialog.open && assignDialog.type === 'productCategory' && (
                        <AssignProductCategoryDialog
                            reference={'supplier'}
                            referenceData={null}
                            ids={assignDialog?.data?.map((item) => item.materialId) || []}
                            isAssigning={false}
                            handleClose={() =>
                                setAssignDialog({ open: false, type: null, data: null })}
                            handleSucess={(data) => {
                                const assignData = data?.map((item) => {
                                    return {
                                        type: assignDialog.type,
                                        materialId: item.id,
                                    }
                                })
                                assignItems(assignData)
                            }}
                        />
                    )
                }
            </Box>

        </>
    )
}

export default SupplierItems;