import { Box, Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { camelCase } from 'lodash';
import React, { useContext, useEffect, useReducer, useState } from 'react'
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import AssignProductCategoryDialog from 'src/components/AssignRolesDialog/AssignProductCategoryDialog';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile, isTablet } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';


function SupplierItems({ api, id, allowedToEdit, permission }) {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { itemTab }: any = parsed;
    const toastConfig = useContext(CustomToastContext);
    const { getColumnData } = useColumns();
    const renderForm = camelCase(routes?.supplierAccount?.title + '_supplierItems');
    const [tabValue, setTabValue] = useState(itemTab ? parseInt(itemTab) : 0);
    const [columns, setColumns] = useState(null);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [state, dispatch] = useReducer(reducer, intialState);
    const [gridApi, setGridApi] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords, filters, sorting, appendRows } = state;

    const [assignDialog, setAssignDialog] = useState({ open: false, type: null, data: null })

    const {
        state: { user }
    }: any = useData();

    useEffect(() => {
        setColumns(null)
        fetchFields()
        fetchData()
    }, [tabValue])

    const fetchData = async () => {
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
        const path = tabValue === 0 ? routes.productCategoryDetail.path : tabValue === 1 ? routes.productDetail.path : routes.serializedAssetDetail.path
        axiosInstance()
            .get(`/field?resource=${selectedResourceData}`)
            .then(({ data: { data } }) => {
                let columns = [];
                let rendererNames = [];
                data.forEach((o) => {
                    let currentColumn = getColumnData(renderForm, o?.fieldData, path, true);
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
                    actionsRenderer: ActionsRenderer
                };
                setFrameWorkComponent({ ...tempFrameworkComponent });
                columns = [...columns, ...getStaticFields()];
                setColumns([...columns]);
            });
    }

    const ActionsRenderer = (params) => (
        <>
            <Tooltip title="Delete">
                <IconButton
                    size="small"
                    aria-label="Delete"
                    onClick={() => {
                        deleteItems([params.data])
                    }}
                >
                    <DeleteIcon color="error" />
                </IconButton>
            </Tooltip>
        </>
    );

    const openActions = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const closeActions = () => {
        setAnchorEl(null);
    };

    const deleteItems = async (values) => {
        const ids = values?.map((item) => item._id)
        axiosInstance().put(`${api}/items/${id}/delete`, { ids: ids }).then(({ data }) => {
            fetchData();
            closeActions();
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: data.message
            });
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        })
    }

    const assignItems = async (values) => {
        axiosInstance().put(`${api}/items/${id}/assign`, values).then(({ data }) => {
            fetchData();
            toastConfig.setToastConfig({
                open: true,
                type: 'success',
                message: data.message
            });
        }).catch((err) => {
            toastConfig.setToastConfig(err);
        })
    }

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        history.push(`?itemTab=${newValue}`);
        setTabValue(newValue);
    };

    return (
        <>
            <Box display="flex" justifyContent={"space-between"}>
                <Box />
                <ImportExportMenu
                    permissions={permission}
                    module="supplier-account-items"
                    api={`${api}/items/${id}`}
                    afterImportCompleted={() => {
                        fetchData();
                    }}
                    isExportAllOrSomeFeature={true}
                    ids={[]}
                    additionalParams={``}
                />
            </Box>
            <CustomTabs value={tabValue} onChange={handleMainTabChange}>
                <CustomTab index={0} label={'Product Category'} value={0} primaryColor={true} />
                <CustomTab index={1} label={'Products'} value={1} primaryColor={true} />
                <CustomTab index={2} label={'Assets'} value={2} primaryColor={true} />
            </CustomTabs>
            <Box display="flex" justifyContent={"space-between"}>
                {allowedToEdit &&
                    <>
                        <Button variant="contained" color="primary" size="small"
                            onClick={() => {
                                if (tabValue === 0) {
                                    setAssignDialog({ open: true, type: 'productCategory', data: dataRows })
                                } else if (tabValue === 1) {
                                    setAssignDialog({ open: true, type: 'product', data: dataRows })
                                } else {
                                    setAssignDialog({ open: true, type: 'serializedAsset', data: dataRows })
                                }
                            }}
                        >
                            Add {tabValue === 0 ? 'Product Category' : tabValue === 1 ? 'Product' : 'Asset'}
                        </Button>
                        <Button
                            variant={isMobile && !isTablet ? 'text' : 'outlined'}
                            color="default"
                            size="small"
                            onClick={openActions}
                            disabled={selectedRecords.length ? false : true}
                            aria-controls="action-menu"
                            className={`${isMobile && !isTablet ? 'mobile_button' : 'new-dropdown-v1'}`}
                            endIcon={<ExpandMore />}
                        >
                            {isMobile && !isTablet ? '' : 'Actions'}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            keepMounted
                            getContentAnchorEl={null}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left'
                            }}
                            id="action-menu"
                            open={Boolean(anchorEl)}
                            onClose={closeActions}
                        >
                            <MenuItem
                                disabled={selectedRecords.length ? false : true}
                                onClick={() => {
                                    deleteItems(selectedRecords)
                                }}
                            >
                                Delete
                            </MenuItem>
                        </Menu>
                    </>
                }

            </Box>
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
                    allowAction={allowedToEdit}
                    loading={loading}
                    renderedFrom={renderForm}
                    refreshGrid={fetchData}
                    selectedRecords={selectedRecords}
                    showFilters={false}
                    allowSelection={allowedToEdit}
                    actionWidth={100}
                    showOnlyShowFilteredRecordSwitch={false}
                />
            )
                : (
                    <Box p={2} height={500}>
                        <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                )}
            {assignDialog.open && assignDialog.type === 'product' && (
                <AssignProductDialog
                    productsDialogOpen={assignDialog.open}
                    productId={null}
                    assignedProducts={assignDialog?.data?.map((item) => item._id) || []}
                    reference='supplier'
                    handleCloseDialog={() =>
                        setAssignDialog({ open: false, type: null, data: null })}
                    onSuccess={(data) => {
                        const assignProducts = data?.map((item) => item.id)
                        assignItems({ products: assignProducts || [] })
                    }}
                    serialized={true}
                />
            )}
            {assignDialog.open && assignDialog.type === 'serializedAsset' && (
                <AssignSerializedAssetDialog
                    reference={'supplier'}
                    referenceData={null}
                    ids={assignDialog?.data?.map((item) => item._id) || []}
                    isAssigning={false}
                    handleClose={() =>
                        setAssignDialog({ open: false, type: null, data: null })}
                    handleSucess={(data) => {
                        const assignData = data?.map((item) => item.id)
                        assignItems({ serializedAssets: assignData || [] })
                    }}
                />
            )}
            {assignDialog.open && assignDialog.type === 'productCategory' && (
                <AssignProductCategoryDialog
                    reference={'supplier'}
                    referenceData={null}
                    ids={assignDialog?.data?.map((item) => item._id) || []}
                    isAssigning={false}
                    handleClose={() =>
                        setAssignDialog({ open: false, type: null, data: null })}
                    handleSucess={(data) => {
                        const assignData = data?.map((item) => item.id)
                        assignItems({ productCategories: assignData || [] })
                    }}
                />
            )}
        </>
    )
}

export default SupplierItems;