import { IconButton } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { IoIosPricetags, RiPriceTagLine } from 'react-icons/all';
import { BiPackage } from 'react-icons/bi';
import { GoDeviceMobile } from 'react-icons/go';
import { MdDescription } from 'react-icons/md';
import { useHistory } from 'react-router-dom';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomContainer from '../../components/CustomContainer';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { getLocalStorageArrayData, gridLoadingTimeout, packages, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManagePackageDialog from './ManagePackageDialog';
import PackageHeader from './PackageHeader';
import ProductListDialog from './ProductListDialog';

let packagesTimeout;

const PackageList = () => {
  const renderedFrom = camelCase(routes?.packages.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
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
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [selectedPackageProducts, setSelectedPackageProducts] = useState([]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.packages}&entity=${selectedEntity}&view=true`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${routes.packagesDetail.path}`, true);
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
      .put(`${packages.api}/remove`, {
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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterpackagess=${selectedType}`;
    if (isExport) {
      deepFilter = `filterpackagess=${selectedType}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
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
      const response: any = await axiosInstance().get(`${packages.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject['canDelete'] = permissions.packages.isDelete;
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
        finalObject['allowedToEdit'] = permissions.packages.isUpdate;
        return {
          ...finalObject
        };
      });
      if (appendRows) {
        dispatch({
          type: 'initialize',
          data: [...dataRows, ...rows],
          count: count
          // selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
        });
      } else {
        dispatch({
          type: 'initialize',
          data: rows,
          count: count
          // selectedRecords: rows.filter((f) => f.isChecked === true)
        });
      }
      // dispatch({ type: 'initialize', data: rows, count: count });
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
    dispatch({ type: 'setPage', page: 0 });
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
        .put(`${packages.api}/remove`, {
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
        .post(`${packages.api}/material/alreadyAssigned`, {
          ids: selectedRecords.map((d) => d._id)
        })
        .then(({ data }) => {
          setSelectedPackageProducts(data?.data);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
      setShowProductAssignDialog(true);
    }
  };

  return (
    <>
      <section className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[routes.packages]} />
          <ImportExportLinks
            permissions={permissions?.packages}
            module="packagess"
            api={packages.api}
            afterImportCompleted={() => {
              fetchPackages();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchPackages();
            }}
            additionalParams={getQueryString(true)}
            extraImportExportLinks={[
              {
                title: 'Sub-Package Template',
                api: `${packages.api}/unknown/package/template`,
                type: 'download'
              },
              {
                title: 'Sub-Package Export',
                api: `${packages.api}/unknown/package/template?export=true${
                  getLocalStorageArrayData(`${localStorageSelectedRecords}`).length
                    ? `&ids=${JSON.stringify(getLocalStorageArrayData(`${localStorageSelectedRecords}`).map((obj) => obj._id))}`
                    : ''
                }`,
                type: 'export'
              },
              {
                title: 'Sub-Package Import',
                api: `${packages.api}/unknown/package/import`,
                type: 'import'
              }
            ]}
          />
        </div>
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
              resource={sidebarResource.packages}
              // showClonepackagesDialog={() => {
              //   handleShowClonepackagesDialog()
              // }}
            ></PackageHeader>
          </div>
          {Object.keys(frameWorkComponent).length > 0 ? (
            isMobile && !isTablet ? (
              <CustomSwipableList
                key={selectedType}
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions?.packages}
                primaryField={columns?.find((d) => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.packagesDetail.path}/${data._id}`);
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.packagesDetail.path}/${data._id}`);
                }}
                extraParamsToCheckDelete={true}
                onDelete={(data) => {
                  setDeleteRecord({});
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
                onClone={(data) => {
                  setShowManagePackageDialog({ open: true, isClone: true, idToClone: data._id });
                }}
                renderedFrom={renderedFrom}
              />
            ) : (
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
                showFilters={true}
                resource={sidebarResource.packages}
              />
            )
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
      </section>
      {showProductAssignDialog && (
        <AssignProductDialog
          reference="package"
          productsDialogOpen={true}
          productId={[...selectedRecords.map((d) => d._id)]}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          assignedProducts={selectedPackageProducts}
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
          toastConfig={toastConfig}
        />
      )}
    </>
  );
};

export default PackageList;
