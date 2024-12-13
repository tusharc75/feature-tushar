import { Box, Button, Chip, IconButton, MenuItem } from '@material-ui/core';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import {
  PLANNING_STATUS,
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManagePlanning from './ManagePlanning';
import axios, { CancelTokenSource } from 'axios';

const Planning = () => {
  const renderedFrom = camelCase(sidebarResource.planning);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, permissions, selectedEntity,resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.planning?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.planning?.titlePlural}`,
      value: 2
    }
  ];

  const history = useHistory();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  // const [selectedType, setSelectedType] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showConverConfirmBox, setShowConverConfirmBox] = useState({ open: false, id: null, planningNumber: '' });
  const [selectedPlanningType, setSelectedPlanningType] = useState(history.location.state);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.planning));
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.planning}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.planningDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 130,
    width: 130,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.planning?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
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
        {row?.original?.status === PLANNING_STATUS.converted ? (
          <HtmlTooltip title={`View Converted ${row?.original?.type}`}>
            <span>
              <IconButton
                aria-label="Convert"
                size="small"
                onClick={() => {
                  let newPath = '';
                  if (row?.original?.type === 'Rental Job') {
                    newPath = `${routes.rentalManagementDetail.path}/${row?.original?.rentalJobId}`;
                  }
                  if (row?.original?.type === 'Sales Order') {
                    newPath = `${routes.salesOrderDetail.path}/${row?.original?.salesOrderId}`;
                  }
                  if (row?.original?.type === 'Field Service Order') {
                    newPath = `${routes?.fieldServiceOrderDetail?.path}/${row?.original?.fieldServiceOrderId}`;
                  }
                  if (newPath) {
                    window.open(newPath, '_blank');
                  }
                }}
              >
                <VisibilityIcon fontSize="small" color={'primary'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : row?.original?.canConvert ? (
          <HtmlTooltip title={permissions?.planning?.isUpdate ? 'Convert' : 'You do not have permission to convert'}>
            <span>
              <IconButton
                disabled={permissions?.planning?.isUpdate ? false : true}
                aria-label="Convert"
                size="small"
                onClick={() => {
                  setShowConverConfirmBox({ open: true, id: row?.original?._id, planningNumber: row?.original?.planningNumber });
                }}
              >
                <AutorenewIcon fontSize="small" color={permissions?.planning?.isUpdate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null}
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.planning?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let count = data?.count;
        let rows = data?.data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.planning?.isUpdate;
          finalObject['canConvert'] = !u?.canDelete;
          finalObject['canDelete'] =
            permissions?.planning?.isDelete && checkIsAllowedToDelete(user, sidebarResource.planning, finalObject?.ownerId) && u?.canDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.planning?.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  const handleConvert = () => {
    axiosInstance()
      .post(`${routes?.planning?.path}/convert-planning`, { id: showConverConfirmBox?.id })
      .then(({ data }) => {
        setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const ActionMeuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)}
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{...routes.planning,title:resources?.planning?.titlePlural}]} />
        <ImportExportLinks
          permissions={permissions?.planning}
          module={resources?.planning?.titlePlural}
          api={routes?.planning?.path}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={<LeftSideContents {...{ permissions, history, selectedPlanningType, setSelectedPlanningType }} />}
          searchValue={search}
          onSearch={handleSearch}
          rightSideContents
          isActionButtonVisible={permissions?.planning?.isDelete}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMeuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={true}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.planning}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${resources?.planning?.titleSingular} ${deleteRecord?.planningNumber || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showConverConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to convert planning  ${showConverConfirmBox?.planningNumber} ?`}
          onClose={() => {
            setShowConverConfirmBox({ open: false, id: null, planningNumber: '' });
          }}
          onOk={handleConvert}
        />
      )}
      {showManageDialog.open && (
        <ManagePlanning
          isClone={showManageDialog.isClone}
          id={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
    </section>
  );
};

export default Planning;

const LeftSideContents = ({ permissions, history, selectedPlanningType, setSelectedPlanningType }) => {
  return (
    <>
      {permissions?.planningView?.isRead && (
        <Button
          className={'toggleButton-v1'}
          onClick={() => {
            history.push({
              pathname: routes.planningView.path,
              state: {
                resource: sidebarResource?.planning
              }
            });
          }}
        >
          <span>{`Calendar`}</span>
        </Button>
      )}
      {selectedPlanningType && (
        <Chip
          color="primary"
          label={'Type: Rental Job'}
          onDelete={() => {
            setSelectedPlanningType(null);
          }}
        />
      )}
    </>
  );
};
