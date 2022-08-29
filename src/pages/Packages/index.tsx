import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Grid, Chip, IconButton } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { BiPackage } from "react-icons/bi";
import { isObjectEmpty, gridLoadingTimeout, packages, product } from '../../constants/helpers';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomContainer from '../../components/CustomContainer';
import { useHistory } from 'react-router-dom';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import PackageHeader from './PackageHeader';
import ManagePackageDialog from './ManagePackageDialog';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { camelCase } from 'lodash';
import ProductListDialog from './ProductListDialog';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import { prepareDataForGrid } from "../../constants/helpers"
import { MdAccountCircle, MdDescription } from "react-icons/md";
import { GoDeviceMobile } from "react-icons/go";
import { AiFillCrown, IoIosPricetags, RiPriceTagLine } from "react-icons/all";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';

let packagesTimeout;

const PackageList = () => {

    const renderedFrom = camelCase(routes?.packages.title)
    const localStorageSelectedRecords = `${renderedFrom}_selected`;

    const toastConfig = useContext(CustomToastContext);

    const history = useHistory();
    const { state: { user, permissions, selectedEntity } }: any = useData();
    const { getColumnData } = useColumns();
    const [selectedType, setSelectedType] = useState(1);
    const [renderCount, setRenderCount] = useState(0);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
    const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
    const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
    const [frameWorkComponent, setFrameWorkComponent] = useState({});
    const [columns, setColumns] = useState([]);
    const [deleteRecord, setDeleteRecord] = useState<any>({});
    const [showManagePackageDialog, setShowManagePackageDialog] = useState({ open: false, isClone: false, idToClone: null });
    const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
    const [openProductListDialog, setOpenProductListDialog] = useState({ open: false, id: null });
    const [singlePackageDelete, setSinglePackageDelete] = useState({
        id: null,
        show: false,
        packageName: ''
    });
    const { packageResource, packageApi } = packages;
    //  Grid Variables - Start
    const [gridApi, setGridApi] = useState(null);
    const [state, dispatch] = useReducer(reducer, intialState);
    const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
    const [selectedPackageProducts, setSelectedPackageProducts] = useState([]);

    useEffect(() => {
        fetchGridColumns();
    }, []);

    const fetchGridColumns = async () => {
        let data;
        const response = await axiosInstance().get(`/field?resource=Packages&entity=${selectedEntity}&view=true`);
        data = response?.data?.data;
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${routes.packagesDetail.path}`);
            if (currentColumn !== null) {
                columns = [...columns, currentColumn?.columnData];
                if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                    rendererNames.push(currentColumn?.rendererName);
                }
            }
            return o?.fieldData;
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
            ...tempFrameworkComponent,
            actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        let staticFields = getStaticFields();
        staticFields.forEach((field) => {
            columns.push(checkStaticField(renderedFrom, field));
        });
        setColumns([...columns]);
    };

    const columnState = JSON.parse(localStorage.getItem(renderedFrom));
    if (columnState) {
        columns.forEach((item) => {
            columnState.forEach((d) => {
                if (d.colId === item.field) {
                    item.show = !d.hide;
                }
            });
        });
    }

    useEffect(() => {
        let millisec = Object.keys(search).length > 0 ? 600 : 5;
        if (packagesTimeout) {
            clearTimeout(packagesTimeout);
        }
        packagesTimeout = setTimeout(() => {
            fetchPackages();
        }, millisec);
        // eslint-disable-next-line
    }, [search]);

    useEffect(() => {
        if (renderCount > 0) {
            fetchPackages();
        } else setRenderCount((preCount) => preCount + 1);
    }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

    const handleSingleDeletePackage = async () => {
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
            .put(`${packageApi}/remove`, {
                ids: [singlePackageDelete.id]
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchPackages();
                dispatch({ type: 'loading', loading: false });
                setSinglePackageDelete({ id: null, show: false, packageName: '' });
            })
            .catch((error) => {
                dispatch({ type: 'loading', loading: false });
                toastConfig.setToastConfig(error);
            });
    };

    const ActionsRenderer = (params) => (
        <>
            {permissions?.packages.isCreate ? (
                <HtmlTooltip title="Clone">
                    <IconButton
                        size="small"
                        aria-label="Clone"
                        onClick={() => {
                            setShowManagePackageDialog({ open: true, isClone: true, idToClone: params.data._id });
                        }}
                    >
                        <FileCopyIcon fontSize="small" color="primary" />
                    </IconButton>
                </HtmlTooltip>
            ) : (
                <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
                    <IconButton aria-label="Clone" size="small">
                        <FileCopyIcon fontSize="small" />
                    </IconButton>
                </HtmlTooltip>
            )}
            <GridDeleteIcon
                hasDeletePermission={permissions?.packages.isDelete}
                ownerId={user?.user?._id}
                userId={user?.user?._id}
                onDelete={() =>
                    setSinglePackageDelete({
                        show: true,
                        id: params.data._id,
                        packageName: `${params.data.packageName}`
                    })
                }
                entity="packages"
            />
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
        let deepFilter = `?page=${page}&limit=${limit}&filterpackagess=${selectedType}`;
        if (isExport) {
            deepFilter = `filterpackagess=${selectedType}`;
        }
        if (showFilteredRecordsOnly) {
            const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
            deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
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

        return deepFilter;
    };

    const fetchPackages = async () => {
        dispatch({ type: 'loading', loading: true });
        const queryString = getQueryString();

        if (gridApi) {
            gridApi.setRowData([]);
        }

        try {
            let data, count;
            const response: any = await axiosInstance().get(`${packageApi}${queryString}`);
            data = response?.data?.data;
            count = response?.data?.count;
            let rows = data.map((u) => {
                let finalObject = prepareDataForGrid(u, user);
                finalObject["canDelete"] = permissions.packages.isDelete;
                finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
                finalObject["allowedToEdit"] = permissions.packages.isUpdate;
                return {
                    ...finalObject,
                };
            });
            dispatch({ type: 'initialize', data: rows, count: count });
            setTimeout(() => {
                dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
        } catch (error) {
            dispatch({ type: 'loading', loading: false });
            toastConfig.setToastConfig(error);
        }
    };

    const handleSearch = (e) => {
        dispatch({ type: 'search', search: e.target.value });
    };

    const handlePackageTypeSel = (filterValues) => {
        setSelectedType(filterValues);
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
            if (selectedRecords.find((d) => d.canDelete === false)) {
                setShowDeleteWarningConfirmBox(true);
            } else {
                setIsConformDialogVisible(true);
            }
        }
    };

    const clickCreateNew = () => {
        setShowManagePackageDialog({ open: true, isClone: false, idToClone: null });
    };

    const handleDeletePackages = async () => {
        setDeleteLoading(true);
        let recordsToDelete = [];
        if (deleteRecord?._id) {
            recordsToDelete.push(deleteRecord?._id);
        } else {
            recordsToDelete = selectedRecords.map((o) => o._id);
        }
        if (recordsToDelete.length > 0) {
            axiosInstance()
                .put(`${packageApi}/remove`, {
                    ids: recordsToDelete
                })
                .then(({ data }) => {
                    toastConfig.setToastConfig({
                        open: true,
                        type: 'success',
                        message: data.message
                    });
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                    if (deleteRecord) setDeleteRecord({});
                    fetchPackages();
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                    setIsConformDialogVisible(false);
                    setDeleteLoading(false);
                });
        }
    };

    const openAssingToProduct = async () => {
        if (selectedRecords.length > 0) {
            await axiosInstance()
                .post(`${packageApi}/material/alreadyAssigned`, {
                    ids: selectedRecords.map(d => d._id)
                })
                .then(({ data }) => {
                    setSelectedPackageProducts(data?.data)
                })
                .catch((error) => {
                    toastConfig.setToastConfig(error);
                });
            setShowProductAssignDialog(true)
        }
    }

    return (
        <>
            <Fragment>
                <Grid container className="headerbox">
                    <Grid item md={4} sm={11} xs={10}>
                        <CustomBreadCrumbs routes={[routes.packages]} />
                    </Grid>
                    <Grid item md={8} sm={1} xs={2}>
                        <Grid container direction="row">
                            <Grid item xs={12} sm={12}>
                                <Grid container justify="flex-end">
                                    <ImportExportLinks
                                        permissions={permissions?.packages}
                                        module="packagess"
                                        api={packageApi}
                                        afterImportCompleted={() => {
                                            fetchPackages();
                                        }}
                                        isExportAllOrSomeFeature={true}
                                        total={rowCount}
                                        recordsToExport={selectedRecords.length}
                                        ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                                        onExportToExcelSuccess={() => {
                                            if (gridApi) gridApi.deselectAll()
                                            else fetchPackages()
                                        }}
                                        additionalParams={getQueryString(true)}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Tables Begins Here */}
                <CustomContainer>
                    <div className="header-panel">
                        <PackageHeader
                            selectedRecords={selectedRecords}
                            onTypeChange={handlePackageTypeSel}
                            options={[]}
                            onSearch={handleSearch}
                            searchVal={search}
                            packagePermissions={permissions?.packages}
                            onCreate={clickCreateNew}
                            showConfirmBox={showConfirmBox}
                            columns={columns}
                            dispatch={dispatch}
                            canDelete={selectedRecords.length === 0}
                            icon={<BiPackage className="headerLogo" />}
                            heading={routes.packages.title}
                            showTransferEntityDialog={handleTransferEntityDialog}
                            openAssingToProduct={openAssingToProduct}
                            filters={filters}
                        // showClonepackagesDialog={() => {
                        //   handleShowClonepackagesDialog()
                        // }}
                        >
                        </PackageHeader>
                    </div>
                    {Object.keys(frameWorkComponent).length > 0 ? (
                        isMobile && !isTablet ? <CustomSwipableList
                            allowSelection={true}
                            allowSwipe={true}
                            permissions={permissions?.packages}
                            primaryField={columns?.find(d => d.primaryField)}
                            onClick={(data) => {
                                history.push(`${routes.packagesDetail.path}/${data._id}`)
                            }}
                            dataRows={dataRows}
                            selectedRecords={selectedRecords}
                            dispatch={dispatch}
                            onEdit={(data) => {
                                history.push(`${routes.packagesDetail.path}/${data._id}?openEdit=true`)
                            }}
                            extraParamsToCheckDelete={true}
                            onDelete={(data) => {
                                setDeleteRecord({})
                            }}
                            rowCount={rowCount}
                            page={page}
                            loading={loading}
                            additionalDetails={[
                                {
                                    icon: <IoIosPricetags size={18} />,
                                    field: 'packageType'
                                }
                            ]}
                            chips={[
                                {
                                    icon: <MdDescription />,
                                    label: 'Package Description: ',
                                    field: 'packageDescription'
                                },
                                {
                                    icon: <GoDeviceMobile />,
                                    label: 'Unit: ',
                                    field: 'unit'
                                },
                                {
                                    icon: <RiPriceTagLine />,
                                    label: 'Pricing Method',
                                    field: 'pricingMethod'
                                }
                            ]}
                            owerCollaboratorInitialsOrImages=""
                            onCreate={false}
                            showClone={true}
                            onClone={(data) => { setShowManagePackageDialog({ open: true, isClone: true, idToClone: data._id }); }}
                            renderedFrom={renderedFrom}
                        /> :
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
                                actionWidth={140}
                                loading={loading}
                                renderedFrom={renderedFrom}
                                allowSelection={true}
                                refreshGrid={fetchPackages}
                                showOnlyShowFilteredRecordSwitch={true}
                            />
                    ) : null}

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
                            message={`Are you sure you want to delete ${deleteRecord?.packageName ? 'this Package' : 'selected Packages'}?`}
                            onClose={() => {
                                if (deleteRecord) setDeleteRecord({});
                                setIsConformDialogVisible(false);
                            }}
                            okBtnLoading={deleteLoading}
                            onOk={handleDeletePackages}
                        />
                    ) : null}

                    {singlePackageDelete.show ? (
                        <ConfirmationDialog
                            open={singlePackageDelete.show}
                            message={`Are you sure you want to delete this Package: ${singlePackageDelete?.packageName} ?`}
                            onClose={() =>
                                setSinglePackageDelete({
                                    id: null,
                                    show: false,
                                    packageName: ''
                                })
                            }
                            onOk={handleSingleDeletePackage}
                        />
                    ) : null}
                </CustomContainer>
            </Fragment>
            {showProductAssignDialog && (
                <AssignProductDialog
                    reference="package"
                    productsDialogOpen={true}
                    productId={[...selectedRecords.map(d => d._id)]}
                    handleCloseDialog={() => setShowProductAssignDialog(false)}
                    assignedProducts={selectedPackageProducts}
                    renderedFrom={`${renderedFrom}_sub-1`}
                    onSuccess={() => {
                        setShowProductAssignDialog(false);
                    }}
                />
            )}
            {showManagePackageDialog.open && (
                <ManagePackageDialog
                    isClone={showManagePackageDialog.isClone}
                    open={showManagePackageDialog.open}
                    packageId={showManagePackageDialog.idToClone}
                    onClose={() => setShowManagePackageDialog({ open: false, isClone: false, idToClone: null })}
                    onSuccess={() => {
                        fetchPackages();
                        setShowManagePackageDialog({ open: false, isClone: false, idToClone: null });
                    }}
                />
            )}
            {openProductListDialog.open && (
                <ProductListDialog
                    renderedFrom={`${renderedFrom}_i-grid-1`}
                    id={openProductListDialog.id}
                    onClose={() => setOpenProductListDialog({ open: false, id: null })}
                    toastConfig={toastConfig} />
            )}
        </>
    );
};

export default PackageList;
