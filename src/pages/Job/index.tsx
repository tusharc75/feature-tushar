import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { useHistory } from 'react-router-dom';
import { Grid, IconButton, Tooltip } from '@material-ui/core';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import queryString from 'query-string';
import {
  isObjectEmpty,
  gridLoadingTimeout,
  prepareDataForGrid,
  getLocalStorageArrayData,
  removeLocalStorage,
  RESOURCE_LABEL
} from '../../constants/helpers';
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
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { camelCase } from 'lodash';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import {
  SiStatuspage,
} from 'react-icons/all';
import JobHeader from './JobHeader';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import ManageJobDialog from './ManageJobDialog';
import CardView from './CardView';

let jobTimeout;


const Job = () => {

  const JobType = [
    {
      key: `All ${routes?.job.title}`,
      value: 1
    },
    {
      key: `My ${routes?.job.title}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(routes?.job.title);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageJobDialog, setShowManageJobDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleJobDelete, setSingleJobDelete] = useState({
    id: null,
    show: false,
    jobNumber: ''
  });
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;
  const [frameworkComponents, setFrameworkComponents] = useState({});
  const { isOffline } = useContext(CustomOfflineContext);
  const [columns, setColumns] = useState([]);
  const [locationKeys, setLocationKeys] = useState([]);
  const [viewType, setViewType] = useState(1)

  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Job`);
    data = response?.data?.data;
    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.jobDetail.path);
      if (currentColumn !== null) {
        if (isOffline) {
          currentColumn.columnData['filter'] = false;
          currentColumn.columnData['sortable'] = false;
        }
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
      columns.push(checkStaticField(renderedFrom, field));
    });
    setColumns([...columns]);
  };

  //  Grid Variables - End

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
    if (jobTimeout) {
      clearTimeout(jobTimeout);
    }
    jobTimeout = setTimeout(() => {
      fetchJob();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchJob();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const handleSingleDeleteJob = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`${routes.job.path}/remove`, {
        ids: [singleJobDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchJob();
        dispatch({ type: 'loading', loading: false });
        setSingleJobDelete({ id: null, show: false, jobNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.job?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowManageJobDialog({ open: true, isClone: true, idToClone: params.data._id });
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
      {params?.data?.canDelete && (
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setSingleJobDelete({
                show: true,
                id: params.data._id,
                jobNumber: `${params.data.jobNumber}`
              });
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
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
    let deepFilter = `?page=${page}&limit=${limit}&filterJob=${selectedType}`;
    if (isExport) {
      deepFilter = `filterJob=${selectedType}`;
    }
    let filterById = [];
    if (filterById.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterById)}`;
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(getLocalStorageArrayData(localStorageSelectedRecords)?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchJob = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${routes.job.path}${queryString}`);
      data = response?.data?.data;
      count = response?.data?.data?.count;
      let rows = data?.data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.job?.isUpdate;
        finalObject['canDelete'] = permissions?.job?.isDelete && finalObject?.ownerId === user?.user?._id;
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

  const handleJobTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`);
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
    setShowManageJobDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteJob = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = getLocalStorageArrayData(localStorageSelectedRecords)?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${routes.job.path}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          removeLocalStorage(localStorageSelectedRecords);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchJob();
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
          <CustomBreadCrumbs routes={[routes.job]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.job}
                  module="job"
                  api={'job'}
                  afterImportCompleted={() => {
                    fetchJob();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords)?.length}
                  ids={
                    getLocalStorageArrayData(localStorageSelectedRecords)?.length
                      ? getLocalStorageArrayData(localStorageSelectedRecords)?.map((obj) => obj._id)
                      : []
                  }
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll();
                    else fetchJob();
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
          <JobHeader
            selectedType={selectedType}
            onTypeChange={handleJobTypeSel}
            options={JobType}
            onSearch={handleSearch}
            columns={columns}
            dispatch={dispatch}
            searchVal={search}
            permissions={permissions}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={getLocalStorageArrayData(localStorageSelectedRecords)?.length === 0}
            filters={filters}
            viewType={viewType}
            setViewType={setViewType}
          />
        </div>

        {
          viewType === 1 &&
          <CardView
            jobs={dataRows}
            setShowManageJobDialog={setShowManageJobDialog}
            setSingleJobDelete={setSingleJobDelete}
            dispatch={dispatch}
            loading={loading}
          />
        }
        {
          viewType === 2 &&
          <>
            {Object.keys(frameworkComponents).length > 0 ? (
              isMobile && !isTablet ? (
                <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions?.job}
                  primaryField={columns?.find((d) => d.primaryField)}
                  onClick={(data) => {
                    history.push(`${routes.jobDetail.path}/${data._id}`);
                  }}
                  dataRows={dataRows}
                  selectedRecords={getLocalStorageArrayData(localStorageSelectedRecords)}
                  dispatch={dispatch}
                  onEdit={(data) => {
                    history.push(`${routes.jobDetail.path}/${data._id}?openEdit=true`);
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
                    setShowManageJobDialog({ open: true, isClone: true, idToClone: data._id });
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
                  refreshGrid={fetchJob}
                  showOnlyShowFilteredRecordSwitch={true}
                  showFilters={true}
                  resource={RESOURCE_LABEL.job}
                />
              )
            ) : null}
          </>
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
            message={`Are you sure you want to delete ${deleteRecord?.jobNumber ? 'Job' : 'Jobs'}   ${deleteRecord.jobNumber || ''
              }?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord({});
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteJob}
          />
        ) : null}

        {singleJobDelete.show ? (
          <ConfirmationDialog
            open={singleJobDelete.show}
            message={`Are you sure you want to delete Job: ${singleJobDelete.jobNumber}?`}
            onClose={() =>
              setSingleJobDelete({
                id: null,
                show: false,
                jobNumber: ''
              })
            }
            onOk={handleSingleDeleteJob}
          />
        ) : null}
      </CustomContainer>
      {showManageJobDialog.open && (
        <ManageJobDialog
          isClone={showManageJobDialog.isClone}
          jobId={showManageJobDialog.idToClone}
          onClose={() => setShowManageJobDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={(data) => {
            history.push(`${routes.jobDetail.path}/${data._id}`);
            setShowManageJobDialog({ open: false, isClone: false, idToClone: null });
          }}
          open={showManageJobDialog.open}
        />
      )}
    </Fragment>
  );
};

export default Job;
