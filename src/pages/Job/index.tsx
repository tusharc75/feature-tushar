import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import AppsIcon from '@material-ui/icons/Apps';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ViewListIcon from '@material-ui/icons/ViewList';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cloneDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  // getLocalStorageArrayData,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import CardView from './CardView';
import ManageJobDialog from './ManageJobDialog';

let jobTimeout;

const Job = () => {
  const renderedFrom = camelCase(routes?.job.title);
  const toastConfig = useContext(CustomToastContext);
  const JobType = [
    {
      key: `My ${routes?.job.title}`,
      value: 1
    },
    {
      key: `All ${routes?.job.title}`,
      value: 2
    }
  ];

  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const history = useHistory();
  let { type }: any = queryString.parse(history.location.search);
  const { state, dispatch } = useTableReducer();
  const { dataRows, rowCount, page, loading, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageJobDialog, setShowManageJobDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);

  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [singleJobDelete, setSingleJobDelete] = useState({
    id: null,
    show: false,
    jobNumber: ''
  });
  const [renderCount, setRenderCount] = useState(0);
  const [viewType, setViewType] = useState(1);

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Job`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.jobDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

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
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchJob();
        dispatch({ type: 'loading', loading: false });
        setSingleJobDelete({ id: null, show: false, jobNumber: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.job?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.job?.isCreate ? false : true}
              onClick={() => {
                setShowManageJobDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.job?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={row?.original?.canDelete ? false : true}
            onClick={() => {
              setSingleJobDelete({
                show: true,
                id: row.original._id,
                jobNumber: `${row.original.jobNumber}`
              });
            }}
          >
            <DeleteIcon color={row?.original?.canDelete ? 'error' : 'disabled'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
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
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || [])?.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchJob = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
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

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
    const values = JobType.find((d) => d.key === type).value;
    setSelectedType(values);
    history.push(`?type=${values}`);
  };

  const showConfirmBox = () => {
    if (selectedRecords?.find((d) => d.canDelete === false)) {
      setShowDeleteWarningConfirmBox(true);
    } else {
      setShowDeleteConfirmBox(true);
    }
  };

  const handleDeleteJob = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes.job.path}/remove`, {
        ids: ids
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchJob();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setAnchorEl(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.job]} />
        <ImportExportLinks
          permissions={permissions?.job}
          module="job"
          api={'job'}
          afterImportCompleted={() => {
            fetchJob();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchJob();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'flex justify-between align-items-center gap-1 w-full'}>
              <ToggleButtonGroup
                size="small"
                className="align-items-center gap-1 "
                value={JobType[selectedType - 1].key}
                exclusive
                onChange={onTypeChange}
              >
                {JobType.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
                {permissions?.fleetDispatch?.isRead && (
                  <Box>
                    <ToggleButtonGroup size="small">
                      <ToggleButton
                        onClick={() => {
                          history.push(`${routes.fleetDispatch.path}`);
                        }}
                      >
                        <span>{routes.fleetDispatch.title}</span>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
                {permissions?.fleetReceiver?.isRead && (
                  <Box>
                    <ToggleButtonGroup size="small">
                      <ToggleButton
                        onClick={() => {
                          history.push(`${routes.fleetReceiver.path}`);
                        }}
                      >
                        <span>{routes.fleetReceiver.title}</span>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}

                <Box>
                  <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                      setViewType(1);
                    }}
                  >
                    <AppsIcon color={viewType === 1 ? 'primary' : 'disabled'} />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Clone"
                    onClick={() => {
                      setViewType(2);
                    }}
                  >
                    <ViewListIcon color={viewType === 2 ? 'primary' : 'disabled'} />
                  </IconButton>
                </Box>
              </ToggleButtonGroup>
            </div>

            <div className="flex flex-wrap gap-[8px] justify-end">
              <SearchBox onChange={handleSearch} value={search} size="small" />
              <div className="flex gap-[8px] flex-wrap items-center">
                <Button
                  variant={'contained'}
                  color="primary"
                  size="small"
                  className={`no-shadow`}
                  onClick={() => {
                    setShowManageJobDialog({ open: true, isClone: false, idToClone: null });
                  }}
                  startIcon={<AddOutlined />}
                >
                  Add
                </Button>
                {permissions?.job?.isDelete && (
                  <>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={`new-dropdown-v1`}
                      aria-controls="action-menu"
                      endIcon={<ExpandMore />}
                      disabled={selectedRecords?.length ? false : true}
                    >
                      Actions
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
                        onClick={() => {
                          closeActions();
                          showConfirmBox();
                        }}
                      >
                        {`Delete (${selectedRecords?.length})`}
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {viewType === 1 && (
          <CardView
            jobs={dataRows}
            setShowManageJobDialog={setShowManageJobDialog}
            setSingleJobDelete={setSingleJobDelete}
            dispatch={dispatch}
            loading={loading}
          />
        )}

        {viewType === 2 && (
          <>
            {columns ? (
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                isClientSideGrid={false}
                refreshGrid={fetchJob}
                showOnlyShowFilteredRecordSwitch={false}
                showFilters={true}
                resource={sidebarResource.job}
              />
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </>
        )}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord?.jobNumber ? 'Job' : 'Jobs'} ${deleteRecord.jobNumber || ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={isSubmitting}
            onOk={handleDeleteJob}
          />
        )}
        {showDeleteWarningConfirmBox ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox}
            message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
            onClose={() => setShowDeleteWarningConfirmBox(false)}
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
    </section>
  );
};

export default Job;
