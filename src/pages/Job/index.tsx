import { Box, Button, IconButton, Menu, MenuItem } from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ViewListIcon from '@mui/icons-material/ViewList';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cloneDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { checkIsAllowedToDelete, getDefaultMyRecordType, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import CardView from './CardView';
import ManageJobDialog from './ManageJobDialog';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';

let jobTimeout;

const Job = () => {
  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const renderedFrom = camelCase(sidebarResource.job);
  const toastConfig = useContext(CustomToastContext);
  const JobType = [
    {
      key: `My ${resources?.job?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.job?.titlePlural}`,
      value: 2
    }
  ];

  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, rowCount, page, loading, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.job));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageJobDialog, setShowManageJobDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);
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
      const cancelTokenSource = axios.CancelToken.source();
      fetchJob(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

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
        {permissions?.job?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.data);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </HtmlTooltip>
        )}
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

  const fetchJob = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    try {
      let data: any = [],
        count;
      const response: any = await axiosInstance().get(`${routes.job.path}${queryString}`, { cancelToken: cancelTokenSource?.token });
      data = response?.data?.data;
      count = response?.data?.data?.count;
      let rows = data?.data.map((u) => {
        let finalObject: any = prepareDataForGrid(u, user);
        finalObject['isChecked'] = false;
        finalObject['allowedToEdit'] = permissions?.job?.isUpdate;
        finalObject['canDelete'] = permissions?.job?.isDelete && checkIsAllowedToDelete(user, sidebarResource.job, finalObject?.ownerId);
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
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const LeftSideContent = () => {
    return (
      <>
        {permissions?.fleetDispatch?.isRead && (
          <Button
            className={'toggleButton-v1'}
            onClick={() => {
              history.push(`${routes.fleetDispatch.path}`);
            }}
          >
            <span>{resources?.fleetDispatch?.titlePlural}</span>
          </Button>
        )}
        {permissions?.fleetReceiver?.isRead && (
          <Button
            className={'toggleButton-v1'}
            onClick={() => {
              history.push(`${routes.fleetReceiver.path}`);
            }}
          >
            <span>{resources?.fleetDispatch?.titlePlural}</span>
          </Button>
        )}

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
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <MenuItem
        disabled={selectedRecords?.every((e) => !e.canDelete) ? true : false}
        onClick={() => {
          if (selectedRecords.length === 1) {
            setDeleteRecord(selectedRecords[0]);
          } else {
            setDeleteRecord(null);
          }
          setShowDeleteConfirmBox(true);
        }}
      >
        {`Delete (${selectedRecords?.length})`}
      </MenuItem>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.job, title: resources?.job?.titlePlural }]} />
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
        <ListingPageHeader
          toggleButtonList={JobType}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={<LeftSideContent />}
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={permissions?.job?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageJobDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={true}
        />

        {viewType === 1 && (
          <CardView
            jobs={dataRows}
            setShowManageJobDialog={setShowManageJobDialog}
            setSingleJobDelete={deleteRecord}
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
            message={`Are you sure you want to delete ${deleteRecord ? `${resources?.job?.titleSingular?.toLowerCase()} : ${deleteRecord?.jobNumber}` : `selected ${resources?.job?.titlePlural?.toLowerCase()}`} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={isSubmitting}
            onOk={handleDeleteJob}
          />
        )}
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
