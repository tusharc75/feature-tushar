import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState, useMemo } from 'react';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import {
  WORK_ORDER_STATUS,
  WORK_ORDER_TYPE,
  checkIsAllowedToDelete,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  workOrder
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageWorkOrder from './ManageWorkOrder';
import { ListingPageHeader } from 'src/components/PageHeaders';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios, { CancelTokenSource } from 'axios';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { AddOutlined } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import ButtonMenu from 'src/components/ButtonMenu';

const WorkOrder = () => {
  let renderedFrom = camelCase(sidebarResource?.workOrder);

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.workOrder));
  const { generateColumns } = useColumns();
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageWorkOrder, setShowManageWorkOrder] = useState({ open: false, isClone: false, idToClone: null });
  const [columns, setColumns] = useState(null);
  const [createWorkOrderResouce, setCreateWorkOrderResouce] = useState([]);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [anchorEl, setAnchorEl] = useState(null);

  const history = useHistory();

  const types = [
    {
      key: `My ${resources?.workOrder?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.workOrder?.titlePlural}`,
      value: 2
    }
  ];

  const [selectedResource, setSelectedResource] = useState({ 'value': '', label: 'All' });

  const resourceItems = useMemo(() => [
    { label: 'All', value: '' },
    ...(permissions?.repairOrder?.isRead ? [{ label: resources?.repairOrder?.titlePlural, value: sidebarResource.repairOrder }] : []),
    ...(permissions?.productionOrder?.isRead ? [{ label: resources?.productionOrder?.titlePlural, value: sidebarResource.productionOrder }] : []),
    ...(permissions?.assemblyOrder?.isRead ? [{ label: resources?.assemblyOrder?.titlePlural, value: sidebarResource.assemblyOrder }] : []),
  ], [permissions, resources]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (renderCount > 0) {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    } else setRenderCount((preCount) => preCount + 1);
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly, selectedResource]);

  useEffect(() => {
    dispatch({ type: 'filter', filters: { status: { filter: [WORK_ORDER_STATUS.new, WORK_ORDER_STATUS.inProgress] } } });
  }, []);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.workOrder}&view=true`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.workOrderDetail?.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${workOrder.api}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] =
            permissions?.workOrder?.isDelete &&
            u?.canDelete &&
            checkIsAllowedToDelete(user, sidebarResource.workOrder, finalObject?.ownerId) &&
            !data?.deleted;
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

  const handlePreview = (workOrder) => {
    axiosInstance()
      .get(`/pdf/${workOrder}?resource=${sidebarResource.workOrder}&columns=[]`, { responseType: 'blob' })
      .then((response) => {
        const blobData = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = fileURL;
        link.target = '_blank';
        link.style.display = 'none';
        link.click();
        toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {row?.original?.type === WORK_ORDER_TYPE.productionOrder && (
          <HtmlTooltip title={'Preview'}>
            <IconButton
              size="small"
              aria-label="Preview"
              onClick={() => {
                handlePreview(row?.original?._id);
              }}
            >
              <VisibilityIcon fontSize="small" color={'primary'} />
            </IconButton>
          </HtmlTooltip>
        )}
        <HtmlTooltip title={row?.original?.canDelete && !row?.original?.deleted ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete && !row?.original?.deleted ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setIsConformDialogVisible(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete && !row?.original?.deleted ? 'error' : 'disabled'} />
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

    if (selectedResource?.value !== '') {
      deepFilters.push({ field: 'type', term: [selectedResource.value] })
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const handleDeleteWorkOrder = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords?.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${workOrder.api}/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          dispatch({ type: 'selection', selectedRecords: [] });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  useEffect(() => {
    const createWorkOrderResouce = [];
    if (permissions?.repairOrder?.isCreate) {
      createWorkOrderResouce.push({
        title: resources?.repairOrder?.titleSingular,
        path: routes.repairOrder.path
      });
    }
    if (permissions?.productionOrder?.isCreate) {
      createWorkOrderResouce.push({
        title: resources?.productionOrder?.titleSingular,
        path: routes.productionOrder.path
      });
    }
    if (permissions?.assemblyOrder?.isCreate) {
      createWorkOrderResouce.push({
        title: resources?.assemblyOrder?.titleSingular,
        path: routes.assemblyOrder.path
      });
    }
    if (createWorkOrderResouce?.length === 0) {
      return null;
    }
    setCreateWorkOrderResouce(createWorkOrderResouce);
  }, [
    permissions?.assemblyOrder?.isCreate,
    permissions?.productionOrder?.isCreate,
    permissions?.repairOrder?.isCreate,
    resources?.assemblyOrder?.titleSingular,
    resources?.productionOrder?.titleSingular,
    resources?.repairOrder?.titleSingular
  ]);

  const ActionMenuItems = () => {
    return (
      <MenuItem
        disabled={selectedRecords.every((e) => e.canDelete && !e?.deleted) ? false : true}
        onClick={() => {
          if (selectedRecords.length === 1) {
            setDeleteRecord(selectedRecords[0]);
          } else {
            setDeleteRecord(null);
          }
          setIsConformDialogVisible(true);
        }}
      >
        {`Delete (${selectedRecords?.length})`}
      </MenuItem>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes?.workOrder, title: resources?.workOrder?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.workOrder}
          module={resources?.workOrder?.titlePlural}
          api={workOrder.api}
          afterImportCompleted={() => {
            fetchData();
          }}
          total={rowCount}
          isExportAllOrSomeFeature={true}
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
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={permissions?.workOrder?.isDelete}
          actionMenuItems={<ActionMenuItems />}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          addButtonOnclick={(e) => {
            // setShowManageWorkOrder({ open: true, isClone: false, idToClone: null });
            if (createWorkOrderResouce?.length === 1) {
              history.push(createWorkOrderResouce[0].path);
            } else {
              setAnchorEl(e.currentTarget);
            }
          }}
          isAddButtonVisible={true}
          leftSideContents={
            <ButtonMenu
              showChevron={true}
              items={resourceItems}
              onItemClick={(e, item: any) => {
                setSelectedResource(item);
              }}
            >
              <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedResource?.label}</span>
            </ButtonMenu>
          }
        />
        {createWorkOrderResouce.length > 1 && (
          <Menu
            anchorEl={anchorEl}
            keepMounted
            id="create-menu"
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            open={Boolean(anchorEl)}
            onClose={() => {
              setAnchorEl(null);
            }}
            slotProps={{
              transition: { timeout: 200 }
            }}
          >
            {createWorkOrderResouce.map((item) => {
              return (
                <MenuItem
                  onClick={() => {
                    history.push(item.path);
                  }}
                >
                  {item?.title}
                </MenuItem>
              );
            })}
          </Menu>
        )}
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
            resource={sidebarResource.workOrder}
            setWholeRowsCellColor={(rowData) => (rowData.deleted ? 'error' : '')}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {isConfirmDialogVisible && (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${deleteRecord
                ? `${resources?.workOrder?.titleSingular?.toLowerCase()} :
              ${deleteRecord?.workOrderNumber || ''}`
                : `selected ${resources?.workOrder?.titlePlural?.toLowerCase()}`
              } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteWorkOrder}
          />
        )}

        {showManageWorkOrder.open && (
          <ManageWorkOrder
            isClone={showManageWorkOrder.isClone}
            workOrderId={showManageWorkOrder.idToClone}
            onClose={() => setShowManageWorkOrder({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              fetchData();
              setShowManageWorkOrder({ open: false, isClone: false, idToClone: null });
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default WorkOrder;
