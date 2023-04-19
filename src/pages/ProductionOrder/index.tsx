import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Fab } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaRegistered } from 'react-icons/fa';
import queryString from 'query-string';
import { isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout, productionOrder, prepareDataForGrid, getLocalStorageArrayData, removeLocalStorage } from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from './../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { camelCase } from 'lodash'
import { FaSuitcase, SiStatuspage, FaWarehouse, GiAutoRepair, GrStatusInfo, BsFillPersonFill, GiCargoShip, FaShippingFast, RiSpaceShipFill } from "react-icons/all"
import ProductionOrderHeader from './ProductionOrderHeader';
import HtmlTooltip from "src/components/CustomTooltipTitle";
import DeleteIcon from '@material-ui/icons/Delete';
import ManageProductionOrder from './ManageProductionOrder';


let productionOrderTimeout;
const ProductionOrderType = [
    {
        key: 'All Production Order',
        value: 1
    },
    {
        key: 'My Production Order',
        value: 2
    }
];

const ProductionOrder = () => {

    const renderedFrom = camelCase(routes?.productionOrder.title)
    const localStorageSelectedRecords = `${renderedFrom}_selected`

    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const { state: { user, permissions, selectedEntity } }: any = useData();
    const { type }: any = queryString.parse(history.location.search);
    const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
    const [renderCount, setRenderCount] = useState(0);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState<any>({});
    const [showManageProductionOrderDialog, setShowManageProductionOrderDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
    const [singleProductionOrderDelete, setSingleProductionOrderDelete] = useState({
        id: null,
        show: false,
        productionOrderNumber: ''
    });

    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
    const [frameworkComponents, setFrameworkComponents] = useState({});
    const [columns, setColumns] = useState([]);

    const { getColumnData } = useColumns();

    useEffect(() => {
        fetchGridColumns();
    }, []);

    const fetchGridColumns = async () => {
        let data
        const response = await axiosInstance().get(`/field?resource=Production Order`)
        data = response?.data?.data
        let columns = []
        let rendererNames = []
        data.forEach(o => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.productionOrderDetail.path)
            if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData]
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName)
                }
            }
            return o?.fieldData
        })
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
        tempFrameworkComponent = {
            ...tempFrameworkComponent,
            actionsRenderer: ActionsRenderer
        }
        setFrameworkComponents({ ...tempFrameworkComponent })
        let staticFields = getStaticFields()
        staticFields.forEach(field => {
            columns.push(checkStaticField(renderedFrom, field))
        })
        setColumns([...columns])
    };

    //  Grid Variables - End
    const [locationKeys, setLocationKeys] = useState([])
    useEffect(() => {
        return history.listen(location => {
            const { type }: any = queryString.parse(history.location.search);
            if (history.action === 'PUSH') {
                setLocationKeys([location.key])
            }
            if (history.action === 'POP') {
                if (locationKeys[1] === location.key) {
                    setLocationKeys(([_, ...keys]) => keys)
                    // Handle forward event
                    setSelectedType(type ? parseInt(type) : 1)

                } else {
                    setLocationKeys((keys) => [location.key, ...keys])
                    // Handle back event
                    setSelectedType(type ? parseInt(type) : 1)

                }
            }
        })
    }, [locationKeys,])


    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (productionOrderTimeout) {
            clearTimeout(productionOrderTimeout);
        }
        productionOrderTimeout = setTimeout(() => {
            fetchProductionOrders();
        }, millisec);
    }, [search]);

    useEffect(() => {
        if (renderCount > 0) {
            fetchProductionOrders();
        } else setRenderCount((preCount) => preCount + 1);
    }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

    const handleSingleDeleteProductionOrder = async () => {
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
            .put(`${productionOrder.api}/remove`, {
                ids: [singleProductionOrderDelete.id]
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchProductionOrders();
                dispatch({ type: 'loading', loading: false });
                setSingleProductionOrderDelete({ id: null, show: false, productionOrderNumber: '' });
            })
            .catch((error) => {
                dispatch({ type: 'loading', loading: false });
                toastConfig.setToastConfig(error);
            });
    };

    const ActionsRenderer = (params) => (
        <>
            {permissions?.productionOrder?.isCreate ? (
                <Tooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManageProductionOrderDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon fontSize="small" color="primary" />
                    </IconButton>
                </Tooltip>
            ) : (
                <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
                    <IconButton aria-label="Clone" size="small">
                        <FileCopyIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            {params?.data?.canDelete &&
                <HtmlTooltip title="Delete">
                    <IconButton size="small" aria-label="Delete" onClick={() => {
                        setSingleProductionOrderDelete({
                            show: true,
                            id: params.data._id,
                            productionOrderNumber: `${params.data.productionOrderNumber}`
                        })
                    }} >
                        <DeleteIcon color="error" />
                    </IconButton>
                </HtmlTooltip >
            }
        </>
    );

    const replaceFieldName = (field) => {
        switch (field) {
            case 'createdBy':
                return 'createdBy.user.concatedName';

            case 'updatedBy':
                return 'updatedBy.user.concatedName';

            default:
                return field;
        }
    };

    const replaceFieldNameForSorting = (field) => {
        const updatedField = replaceFieldName(field);

        if (field !== updatedField) return updatedField;

        switch (field) {
            case 'owner':
                return 'owner.optionLabel';

            case 'customerAccount':
                return 'customerAccount.optionLabel';

            case 'supplierAccountName':
                return 'supplierAccountName.optionLabel';

            default:
                return field;
        }
    };

    const getQueryString = (isExport = false) => {
        let deepFilter = `?page=${page}&limit=${limit}&filterProductionOrders=${selectedType}`;
        if (isExport) {
            deepFilter = `filterProductionOrders=${selectedType}`;
        }
        let filterById = [];
        if (filterById.length) {
            deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`
        }
        if (!isObjectEmpty(filters)) {
            const updatedFilters = [];
            Object.keys(filters).forEach((field) => {
                updatedFilters.push({
                    field: replaceFieldName(field),
                    term: filters[field].filter
                });
            });
            deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
        }
        if (sorting.length > 0) {
            deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
        }
        if (search) {
            deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
        }
        if (showFilteredRecordsOnly) {
            deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map(m => m._id))}`;
        }
        return deepFilter;
    };

    const fetchProductionOrders = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();
        if (gridApi) {
            gridApi.setRowData([]);
        }
        try {
            let data: any = [], count;
            const response: any = await axiosInstance().get(`${productionOrder.api}${queryString}`);
            data = response?.data?.data;
            count = response?.data?.count;
            let rows = data.map((u) => {
                let finalObject: any = prepareDataForGrid(u, user);
                finalObject["isChecked"] = false;
                finalObject["allowedToEdit"] = permissions?.productionOrder?.isUpdate;
                finalObject["canDelete"] = permissions?.productionOrder?.isDelete && finalObject?.ownerId === user?.user?._id && u?.canDelete
                return finalObject;
            });
            if (appendRows) {
                dispatch({ type: "initialize", data: [...dataRows, ...rows], count: count });
            } else {
                dispatch({ type: "initialize", data: rows, count: count });
            }
            setTimeout(() => {
                dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
        } catch (error) {
            dispatch({ type: "loading", loading: false });
            toastConfig.setToastConfig(error);
        }
    };

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const handleProductionOrderTypeSel = (filterValues) => {
        setSelectedType(filterValues);
        history.push(`?type=${filterValues}`)
    };

    const handleTransferEntityDialog = () => {
        setShowTransferEntityDialog(true);
    };

    const showConfirmBox = (row) => {
        if (row) {
            setIsConformDialogVisible(true);
            if (row && row._id) {
                setDeleteRecord(row);
            }
        } else {
            if (getLocalStorageArrayData(localStorageSelectedRecords)?.find((d) => d.canDelete === false)) {
                setShowDeleteWarningConfirmBox(true);
            } else {
                setIsConformDialogVisible(true);
            }
        }
    };

    const clickCreateNew = () => {
        setShowManageProductionOrderDialog({ open: true, isClone: false, idToClone: null });
    };

    const handleDeleteProductionOrder = async () => {
        setDeleteLoading(true);
        let recordsToDelete = [];
        if (deleteRecord?._id) {
            recordsToDelete.push(deleteRecord?._id);
        } else {
            recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
        }
        if (recordsToDelete.length > 0) {
            axiosInstance()
                .put(`${productionOrder.api}/remove`, {
                    ids: recordsToDelete
                })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                    removeLocalStorage(localStorageSelectedRecords)
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord({});
                    fetchProductionOrders();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    return (
        <Fragment>
            <Grid container className="headerbox">
                <Grid item md={4} sm={11} xs={10}>
                    <CustomBreadCrumbs routes={[routes.productionOrder]} />
                </Grid>
                <Grid item md={8} sm={1} xs={2}>
                    <Grid container direction="row">
                        <Grid item xs={12} sm={12}>
                            <Grid container justify="flex-end">
                                <ImportExportLinks
                                    permissions={permissions?.productionOrder}
                                    module="productionOrder"
                                    api={productionOrder.api}
                                    afterImportCompleted={() => { fetchProductionOrders() }}
                                    isExportAllOrSomeFeature={true}
                                    total={rowCount}
                                    recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords)?.length}
                                    ids={
                                        getLocalStorageArrayData(localStorageSelectedRecords)?.length
                                            ? getLocalStorageArrayData(localStorageSelectedRecords)?.map((obj) => obj._id)
                                            : []
                                    }
                                    onExportToExcelSuccess={() => {
                                        if (gridApi) gridApi.deselectAll()
                                        else fetchProductionOrders()
                                    }}
                                    additionalParams={getQueryString(true)}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <CustomContainer>
                <div className="header-panel">
                    <ProductionOrderHeader
                        selectedType={selectedType}
                        selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
                        onTypeChange={handleProductionOrderTypeSel}
                        options={ProductionOrderType}
                        onSearch={handleSearch}
                        columns={columns}
                        dispatch={dispatch}
                        searchVal={search}
                        ProductionOrderPermissions={permissions?.productionOrder}
                        onCreate={clickCreateNew}
                        showConfirmBox={showConfirmBox}
                        canDelete={getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0}
                        icon={<FaRegistered className="headerLogo" />}
                        heading={routes.productionOrder.title}
                        showTransferEntityDialog={handleTransferEntityDialog}
                        filters={filters}
                    // showCloneProductionOrderDialog={() => {
                    //   handleShowCloneProductionOrderDialog()
                    // }}
                    >
                    </ProductionOrderHeader>
                </div>
                {
                    Object.keys(frameworkComponents).length > 0 ?
                        isMobile && !isTablet ?
                            <CustomSwipableList
                                allowSelection={true}
                                allowSwipe={true}
                                permissions={permissions?.productionOrder}
                                primaryField={columns?.find(d => d.primaryField)}
                                onClick={(data) => {
                                    history.push(`${routes.productionOrderDetail.path}/${data._id}`)
                                }}
                                dataRows={dataRows}
                                selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
                                dispatch={dispatch}
                                onEdit={(data) => {
                                    history.push(`${routes.productionOrderDetail.path}/${data._id}?openEdit=true`)
                                }}
                                extraParamsToCheckDelete={true}
                                onDelete={(data) => {
                                    setDeleteRecord(data._id);
                                    setIsConformDialogVisible(true);
                                }}
                                rowCount={rowCount}
                                page={page}
                                loading={loading}
                                chips={[
                                    {
                                        icon: <SiStatuspage />,
                                        label: "Status: ",
                                        field: "status",
                                    }
                                ]}
                                onCreate={false}
                                showClone={true}
                                onClone={(data) => { setShowManageProductionOrderDialog({ open: true, isClone: true, idToClone: data._id }); }}
                                renderedFrom={renderedFrom}
                            /> :
                            <CustomAgGrid
                                columns={columns}
                                dataRows={dataRows}
                                frameworkComponents={frameworkComponents}
                                setGridApi={setGridApi}
                                dispatch={dispatch}
                                rowCount={rowCount}
                                limit={limit}
                                pageSizes={pageSizes}
                                page={page}
                                actionWidth={100}
                                loading={loading}
                                renderedFrom={renderedFrom}
                                refreshGrid={fetchProductionOrders}
                                showOnlyShowFilteredRecordSwitch={true}
                            /> : null
                }

                {showDeleteWarningConfirmBox ? (
                    <MessageDialog
                        open={showDeleteWarningConfirmBox}
                        message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
                        onClose={() => setShowDeleteWarningConfirmBox(false)}
                    />
                ) : null}
                {isConfirmDialogVisible ? (
                    <ConfirmationDialog
                        open={isConfirmDialogVisible}
                        message={`Are you sure you want to delete ${deleteRecord?.productionOrderNumber ? 'Production Order' : 'Production Orders'}   ${deleteRecord.productionOrderNumber || ''
                            }?`}
                        onClose={() => {
                            if (deleteRecord) setDeleteRecord({});
                            setIsConformDialogVisible(false);
                        }}
                        okBtnLoading={deleteLoading}
                        onOk={handleDeleteProductionOrder}
                    />
                ) : null}

                {singleProductionOrderDelete.show ? (
                    <ConfirmationDialog
                        open={singleProductionOrderDelete.show}
                        message={`Are you sure you want to delete Production Order: ${singleProductionOrderDelete.productionOrderNumber}?`}
                        onClose={() =>
                            setSingleProductionOrderDelete({
                                id: null,
                                show: false,
                                productionOrderNumber: ''
                            })
                        }
                        onOk={handleSingleDeleteProductionOrder}
                    />
                ) : null}
            </CustomContainer>
            {showManageProductionOrderDialog.open && (
                <ManageProductionOrder
                    isClone={showManageProductionOrderDialog.isClone}
                    productionOrderId={showManageProductionOrderDialog.idToClone}
                    onClose={() => setShowManageProductionOrderDialog({ open: false, isClone: false, idToClone: null })}
                    onSuccess={(data) => {
                        history.push(`${routes.productionOrderDetail.path}/${data._id}`);
                        setShowManageProductionOrderDialog({ open: false, isClone: false, idToClone: null });
                    }}
                />
            )}
        </Fragment>
    );
};

export default ProductionOrder;
