import { Chip, IconButton, Tooltip } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiTimer, SiStatuspage } from 'react-icons/all';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { getLocalStorageArrayData, gridLoadingTimeout, leadTimeMaster, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import useColumns, { checkStaticField, getFrameworkComponents, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import LeadTimeHeader from './LeadTimeHeader';
import ManageLeadTimeMasterDialog from './ManageLeadTimeMaster';

let leadMasterTimeout;
const LeadMasterType = [
  {
    key: 'All Lead Time Master',
    value: 1
  },
  {
    key: 'My Lead Time Master',
    value: 2
  }
];

const LeadTimeMaster = () => {
  const renderedFrom = camelCase(routes?.leadTimeMaster.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  let { type, referenceId, referenceType }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageLeadTimeMasterDialog, setShowManageLeadTimeMasterDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleLeadTimeDelete, setSingleLeadTimeDelete] = useState({
    id: null,
    show: false,
    leadTimeMasterName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const [columns, setColumns] = useState([]);
  const pageTitle = camelCase(`${routes.leadTimeMaster.title}`);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const { getColumnData } = useColumns();



  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Lead Time Master`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(pageTitle, o?.fieldData, routes.leadTimeMasterDetail.path, true);
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
    setFrameworkComponents({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(pageTitle, field));
    });
    setColumns([...columns]);
  };

  //  Grid Variables - End
  const [locationKeys, setLocationKeys] = useState([]);
  useEffect(() => {
    return history.listen((location) => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1);
        }
      }
    });
  }, [locationKeys]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (leadMasterTimeout) {
      clearTimeout(leadMasterTimeout);
    }
    leadMasterTimeout = setTimeout(() => {
      fetchLeadTimeMasters();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchLeadTimeMasters();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteLeadTimeMaster = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${leadTimeMaster.api}/remove`, {
        ids: [singleLeadTimeDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchLeadTimeMasters();
        dispatch({ type: 'loading', loading: false });
        setSingleLeadTimeDelete({ id: null, show: false, leadTimeMasterName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.leadTimeMaster?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageLeadTimeMasterDialog({ open: true, isClone: true, idToClone: params.data._id });
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
      {permissions.leadTimeMaster?.isDelete ? (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setSingleLeadTimeDelete({
                id: params.data?._id,
                show: true,
                leadTimeMasterName: `${params.data?.leadTimeName}`
              });
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete an product">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (referenceId) {
      filterByIds.push({ field: 'rentalJob', term: referenceId });
    }

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
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchLeadTimeMasters = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${leadTimeMaster.api}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.count;
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.leadTimeMaster?.isUpdate;
        finalObject['owerCollaboratorInitialsOrImages'] = [];
        if (finalObject['owner']) finalObject['owerCollaboratorInitialsOrImages'].push({ initials: finalObject['owner'] });
        finalObject['owerCollaboratorInitialsOrImages'].forEach((f) => {
          if (f.initials) {
            f.initials = f.initials
              .split(' ')
              .map((i) => i[0])
              .join('');
          }
        });
        return finalObject;
      });
      if (appendRows) {
        dispatch({ type: 'initialize', data: [...dataRows, ...rows], count: count });
      } else {
        dispatch({ type: 'initialize', data: rows, count: count });
      }
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

  const handleLeadTimeMasterTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    if(referenceId && referenceType) {
      history.push(`?type=${filterValues}&referenceType=${referenceType}&referenceId=${referenceId}`);
      } else {
        history.push(`?type=${filterValues}`);
      }
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
    setShowManageLeadTimeMasterDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteLeadTimeMaster = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${leadTimeMaster.api}/remove`, {
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
          fetchLeadTimeMasters();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const updateQueryParams = () => {
    const queryParams = new URLSearchParams(history.location.search)
    queryParams.delete('referenceId')
    queryParams.delete('referenceType')
    referenceId = queryParams.get('referenceId');
    referenceType = queryParams.get('referenceType');
    history.replace({
      search: queryParams.toString(),
    })
    fetchLeadTimeMasters();
  }

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.leadTimeMaster]} />
        <ImportExportLinks
          permissions={permissions.leadTimeMaster}
          module="leadTimeMaster"
          api={leadTimeMaster.api}
          afterImportCompleted={() => {
            fetchLeadTimeMasters();
          }}
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
            else fetchLeadTimeMasters();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <LeadTimeHeader
            selectedType={selectedType}
            selectedRecords={selectedRecords}
            onTypeChange={handleLeadTimeMasterTypeSel}
            options={LeadMasterType}
            onSearch={handleSearch}
            columns={columns}
            dispatch={dispatch}
            searchVal={search}
            LeadTimePermissions={permissions.leadTimeMaster}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<BiTimer className="headerLogo" />}
            heading={routes.leadTimeMaster.title}
            showTransferEntityDialog={handleTransferEntityDialog}
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
            {referenceType && (
              <Chip
                className="ml-3"
                color="primary"
                label={`Rental Job : ${referenceType}`}
                onDelete={updateQueryParams}
              />
            )}
          </LeadTimeHeader>
        </div>
        {Object.keys(frameworkComponents).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.leadTimeMaster}
              primaryField={columns?.find((d) => d.primaryField)}
              onClick={(data) => {
                history.push(`${routes.leadTimeMasterDetail.path}/${data._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(data) => {
                history.push(`${routes.leadTimeMasterDetail.path}/${data._id}`);
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
                  label: 'Status: ',
                  field: 'status'
                }
              ]}
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowManageLeadTimeMasterDialog({ open: true, isClone: true, idToClone: data._id });
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
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
              refreshGrid={fetchLeadTimeMasters}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={true}
              resource={sidebarResource.leadTimeMaster}
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
            message={`Are you sure you want to delete ${deleteRecord?.leadTimeMasterName ? 'Lead Time Master' : 'Lead Time Masters'}   ${
              deleteRecord.leadTimeMasterName || ''
            }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteLeadTimeMaster}
          />
        ) : null}

        {singleLeadTimeDelete.show ? (
          <ConfirmationDialog
            open={singleLeadTimeDelete.show}
            message={`Are you sure you want to delete Lead Time Master: ${singleLeadTimeDelete.leadTimeMasterName}?`}
            onClose={() =>
              setSingleLeadTimeDelete({
                id: null,
                show: false,
                leadTimeMasterName: ''
              })
            }
            onOk={handleSingleDeleteLeadTimeMaster}
          />
        ) : null}
      </CustomContainer>
      {showManageLeadTimeMasterDialog.open && (
        <ManageLeadTimeMasterDialog
          isClone={showManageLeadTimeMasterDialog.isClone}
          leadTimeMasterId={showManageLeadTimeMasterDialog.idToClone}
          onClose={() => setShowManageLeadTimeMasterDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            fetchLeadTimeMasters();
            setShowManageLeadTimeMasterDialog({ open: false, isClone: false, idToClone: null });
            history.push(`${routes.leadTimeMasterDetail.path}/${data._id}`);
          }}
        />
      )}
    </section>
  );
};

export default LeadTimeMaster;
