import { Box, Button, Grid, IconButton } from '@material-ui/core';
import { camelCase, capitalize, set } from 'lodash';
import React, { useContext, useEffect, useReducer, useState } from 'react'
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
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';




function SupplierItems({ api, id, allowedToEdit }) {

    const toastConfig = useContext(CustomToastContext);
    const { isOffline } = useContext(CustomOfflineContext);
    const { getColumnData } = useColumns();

    let selectedResource;



    const renderForm = camelCase(routes?.supplierAccount?.title + '_supplierItems');
    const [tabValue, setTabValue] = useState(0);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [pCategoryRows, setPCategoryRows] = useState(null)
    const [pRows, setPRows] = useState(null)
    const [aRows, setARows] = useState(null)
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [state, dispatch] = useReducer(reducer, intialState);
    const [gridApi, setGridApi] = useState(null);


    const { dataRows, rowCount, loading, page, limit, pageSizes, filters, sorting, appendRows } = state;


    const [assignDialog, setAssignDialog] = useState({ open: false, type: null, data: null })

    useEffect(() => {
        fetchData()
    }, [id, tabValue])

    const {
        state: { user }
    }: any = useData();

    const fetchData = async () => {
        setColumns(null)
        fetchFields()
        dispatch({ type: 'loading', loading: true });
        axiosInstance().get(`${api}/items/${id}/${tabValue === 0 ? 'productCategory' : tabValue === 1 ? 'product' : 'serializedAsset'}`).then((res) => {
            let rows = res?.data?.data?.map((u) => {
                let finalObject: any = prepareDataForGrid(u, user);

                return finalObject;
            });
            dispatch({ type: 'initialize', data: [...rows], count: rows?.length });

            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        }).catch((err) => {
            dispatch({ type: 'loading', loading: false });
        })

    }
    const fetchFields = async () => {
        const selectedResourceData: any = tabValue === 0 ? sidebarResource.productCategory : tabValue === 1 ? sidebarResource.product : sidebarResource.serializedAsset
        selectedResource = selectedResource
        axiosInstance()
            .get(`/field?resource=${selectedResourceData}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderForm, o?.fieldData, selectedResourceData.path, true);
                    if (currentColumn !== null) {
                        columns = [...columns, currentColumn?.columnData];
                        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                            rendererNames.push(currentColumn?.rendererName);
                        }
                    }
                });
                let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
                tempFrameworkComponent = {
                    ...tempFrameworkComponent,
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
            });
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
        axiosInstance().put(`${api}/items/${id}/assign`, values).then((res) => {
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
                {Object.keys(frameWorkComponent).length > 0 && columns?.length ? (
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        allowAction={false}
                        loading={loading}
                        renderedFrom={renderForm}
                        refreshGrid={fetchData}
                        showFilters={true}
                        allowSelection={false}
                        resource={selectedResource}
                        showOnlyShowFilteredRecordSwitch={false}
                    />
                )
                    : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
                {Object.keys(frameWorkComponent).length > 0 && columns?.length ? (
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        allowAction={false}
                        loading={loading}
                        renderedFrom={renderForm}
                        refreshGrid={fetchData}
                        showFilters={true}
                        allowSelection={false}
                        resource={selectedResource}
                        showOnlyShowFilteredRecordSwitch={false}
                    />
                )
                    : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
                {Object.keys(frameWorkComponent).length > 0 && columns?.length ? (
                    <CustomAgGrid
                        columns={columns}
                        dataRows={dataRows}
                        frameworkComponents={frameWorkComponent}
                        setGridApi={setGridApi}
                        dispatch={dispatch}
                        rowCount={rowCount}
                        limit={limit}
                        pageSizes={pageSizes}
                        page={page}
                        allowAction={false}
                        loading={loading}
                        renderedFrom={renderForm}
                        refreshGrid={fetchData}
                        showFilters={true}
                        allowSelection={false}
                        resource={selectedResource}
                        showOnlyShowFilteredRecordSwitch={false}
                    />
                )
                    : (
                        <Box p={2} height={500}>
                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                    )}
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
                            const assignProducts = data?.map((item) => item.id)
                            assignItems({ products: assignProducts || [] })
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
                            const assignData = data?.map((item) => item.id)
                            assignItems({ serializedAssets: assignData || [] })
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
                            const assignData = data?.map((item) => item.id)
                            assignItems({ productCategories: assignData || [] })
                        }}
                    />
                )
            }


        </>
    )
}

export default SupplierItems;