import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Chip, Grid, IconButton, Tooltip, Box } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { FaSuitcase } from 'react-icons/fa';
import { GiHiveMind } from "react-icons/gi";
import { MdContactPhone, RiContactsBookUploadFill, RiShip2Fill, FaWarehouse, SiStatuspage } from 'react-icons/all';
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  quotation,
  sidebarResource,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage
} from '../../constants/helpers';
import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import QuotationHeader from './QuotationHeader';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { camelCase } from 'lodash'
import ManageQuotationDialog from './ManageQuotationDialog';
import DeleteIcon from '@material-ui/icons/Delete';

let quotationTimeout;


const Quotation = () => {

  const QuotationType = [
    {
      key: `All ${routes.quotation.title}`,
      value: 1
    },
    {
      key: `My ${routes.quotation.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.quotation.title)
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageQuotationDialog, setShowManageQuotationDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleQuotationDelete, setSingleQuotationDelete] = useState({
    id: null,
    show: false,
    quotationNumber: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { getColumnData } = useColumns();
  const [frameworkComponent, setFrameworkComponent] = useState({});
  const [columns, setColumns] = useState(null);
  const localStorageSelectedRecords = `${renderedFrom}_selected`

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Quotation`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.quotationDetail.path);
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
    setFrameworkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);

    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      let savedFilter = JSON.parse(sessionStorage.getItem('filters'));
      dispatch({ type: 'filter', filters: savedFilter });
    }
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (quotationTimeout) {
      clearTimeout(quotationTimeout);
    }

    quotationTimeout = setTimeout(() => {
      fetchQuotation();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchQuotation();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteQuotation = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${quotation.api}/remove`, {
        ids: [singleQuotationDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchQuotation();
        dispatch({ type: 'loading', loading: false });
        setSingleQuotationDelete({ id: null, show: false, quotationNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.quotation?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageQuotationDialog({ open: true, isClone: true, idToClone: params.data._id });
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
      {permissions?.quotation?.isDelete ? (
        <GridDeleteIcon
          hasDeletePermission={permissions?.quotation?.isDelete}
          ownerId={user?.user?._id}
          userId={user?.user?._id}
          onDelete={() =>
            setSingleQuotationDelete({
              show: true,
              id: params.data._id,
              quotationNumber: `${params.data.quotationNumber}`
            })
          }
          entity="quotation"
        />
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Clone" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
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
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map(m => m._id))}`;
    }
    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('customerAccount'),
            term: accountDetails.accountId
          }
        ])}`;
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName('supplierAccountName'),
            term: { $in: [accountDetails.accountId] }
          }
        ])}`;
      }
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

  const fetchQuotation = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${quotation.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject["isChecked"] = false;
          finalObject["allowedToEdit"] = permissions?.quotation?.isUpdate;
          finalObject["canDelete"] = permissions?.quotation?.isDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleQuotationTypeSel = (filterValues) => {
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
      if (getLocalStorageArrayData(localStorageSelectedRecords)?.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const clickCreateNew = () => {
    setShowManageQuotationDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteQuotation = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${quotation.api}/remove`, {
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
          fetchQuotation();
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
          <CustomBreadCrumbs routes={[routes.quotation]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.quotation}
                  module="quotation"
                  api={quotation.api}
                  afterImportCompleted={() => { }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
                  ids={
                    getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                      ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                      : []
                  }
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchQuotation();
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
          {columns &&
            <QuotationHeader
              selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
              onTypeChange={handleQuotationTypeSel}
              options={QuotationType}
              onSearch={handleSearch}
              searchVal={search}
              QuotationPermissions={permissions?.quotation}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading={routes.quotation.title}
              showTransferEntityDialog={handleTransferEntityDialog}
              columns={columns}
              dispatch={dispatch}
              filters={filters}
            >
              {accountDetails.accountId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({
                      accountId: null,
                      accountName: null,
                      resource: null
                    });
                  }}
                />
              )}
            </QuotationHeader>
          }
        </div>
        {(Object.keys(frameworkComponent).length > 0 && columns) ?
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions?.quotation}
              primaryField={columns?.find(d => d.field === "quotationNumber")}
              onClick={(data) => {
                history.push(`${routes.quotationDetail.path}/${data._id}`)
              }}
              dataRows={dataRows}
              selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.quotationDetail.path}/${data._id}?openEdit=true`)
              }}
              extraParamsToCheckDelete={true}
              onDelete={(data) => {
                setSingleQuotationDelete({
                  show: true,
                  id: data._id,
                  quotationNumber: `${data.quotationNumber}`
                })
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: "customerAccount"
                },
              ]}
              chips={[
                {
                  icon: <MdContactPhone />,
                  label: "Customer Contact: ",
                  field: "customerContact"
                },
                {
                  icon: <RiContactsBookUploadFill />,
                  label: "Billing Address: ",
                  field: "billingAddress"
                },
                {
                  icon: <RiShip2Fill />,
                  label: "Shipping Address: ",
                  field: "shippingAddress"
                },
                {
                  icon: <FaWarehouse />,
                  label: "Plants: ",
                  field: "plants"
                },
                {
                  icon: <SiStatuspage />,
                  label: "Status: ",
                  field: "status:"
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => { setShowManageQuotationDialog({ open: true, isClone: true, idToClone: data._id }) }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchQuotation}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.quotation}
            />
          ) : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>}
        {showDeleteWarningConfirmBox &&
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
          />
        }
        {isConfirmDialogVisible &&
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${routes?.quotation?.title?.toLowerCase()} ${deleteRecord?.quotationNumber || ''} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteQuotation}
          />
        }
        {singleQuotationDelete.show && (
          <ConfirmationDialog
            open={singleQuotationDelete.show}
            message={`Are you sure you want to delete quotation: ${singleQuotationDelete.quotationNumber}?`}
            onClose={() =>
              setSingleQuotationDelete({
                id: null,
                show: false,
                quotationNumber: ''
              })
            }
            onOk={handleSingleDeleteQuotation}
          />
        )}
      </CustomContainer>
      {showManageQuotationDialog.open && (
        <ManageQuotationDialog
          isClone={showManageQuotationDialog.isClone}
          open={showManageQuotationDialog.open}
          quotationId={showManageQuotationDialog.idToClone}
          onClose={() => setShowManageQuotationDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchQuotation();
            setShowManageQuotationDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </Fragment>
  );
};

export default Quotation;
