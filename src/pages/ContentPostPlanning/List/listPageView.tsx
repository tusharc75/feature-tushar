import { Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import { useContext, useEffect, useMemo, useState } from 'react';
import { camelCase } from 'lodash';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { deleteDisable, editDisable } from 'src/constants/messageHelpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import axiosInstance from 'src/axios/axiosInstance';
import CustomContainer from 'src/components/CustomContainer';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { sidebarResource, prepareDataForGrid, CONTENT_PLANNING_STATUS_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import ManageContentPostPlanning from '../ManageContentPostPlanning';
import { Edit } from '@mui/icons-material';
import routes from 'src/components/Helpers/Routes';
import ButtonMenu from 'src/components/ButtonMenu';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import { HourglassEmpty, CheckCircle, Schedule, Category } from '@mui/icons-material';

const ListView = ({ topRightSlot }) => {
  const renderedFrom = camelCase(sidebarResource?.contentPostPlanning);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState<any>(null);
  const pageTitle = camelCase(`${resources?.contentPostPlanning?.titlePlural}`);
  const { generateColumns, checkStaticField } = useColumns();
  // const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.repairJob));
  const [selectedType, setSelectedType] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isEdit: false, idToEdit: null });
  const [selectedStatus, setSelectedStatus] = useState(CONTENT_PLANNING_STATUS_STATUS.pendingApproval);

  const types = [
    {
      key: `My ${resources?.contentPostPlanning?.titlePlural}`,
      value: 1
    },
    // {
    //     key: `Open ${resources?.contentPostPlanning?.titlePlural}`,
    //     value: 2
    // },
    {
      key: `All ${resources?.contentPostPlanning?.titlePlural}`,
      value: 2
    }
    // {
    //     key: `Closed ${resources?.contentPostPlanning?.titlePlural}`,
    //     value: 4
    // }
  ];
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    try {
      const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.contentPostPlanning, permissions.contentPostPlanning?.isUpdate);
      const data = fieldsDataForRead;
      let newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes.contentPostPlanningDetail.path, true);
      let staticFields = getStaticFields(true);
      staticFields.forEach((field) => {
        if (field.id !== 'lastActivityBy') {
          newColumns.push(checkStaticField(pageTitle, field));
        }
      });
      setColumns([...newColumns, ActionsRenderer]);
    } catch (ex: any) {
      toastConfig.setToastConfig({ open: true, type: 'error', message: ex.message || 'Error fetching columns' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, page, limit, filters, sorting, showFilteredRecordsOnly, selectedType, selectedStatus]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }: any) => (
      <>
        <HtmlTooltip title={permissions?.contentPostPlanning?.isUpdate ? 'Edit' : editDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Edit"
              disabled={permissions?.contentPostPlanning?.isUpdate ? false : true}
              onClick={() => {
                setShowManageDialog({ open: true, isEdit: true, idToEdit: row.original._id });
              }}
            >
              <Edit fontSize="small" color={permissions?.contentPostPlanning?.isUpdate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
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
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    } else if (selectedType === 2) {
      deepFilter = deepFilter + `&openRecords=1`;
    }
    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedStatus && selectedStatus !== '' && selectedStatus !== 'Others') {
      deepFilters.push({ field: 'status', term: selectedStatus });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    const response: any = await axiosInstance()
      .get(`/content-post-planning${queryString}`)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data.map((u: any) => {
            let finalObject: any = prepareDataForGrid(u, user);
            finalObject['isChecked'] = false;
            finalObject['canDelete'] = permissions?.contentPostPlanning?.isDelete;
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows, count: count });

          dispatch({ type: 'loading', loading: false });
        }
      )
      .catch((error: any) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleSearch = (e: any) => {
    dispatch({ type: 'search', search: e.target.value });
  };
  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const handleDelete = async () => {
    let recordsToDelete: string[] = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord._id);
    } else {
      recordsToDelete = selectedRecords.map((o: any) => o._id);
    }
    if (recordsToDelete.length > 0) {
      setDeleteLoading(true);
      axiosInstance()
        .put(`/content-post-planning/remove`, {
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({ open: true, type: 'success', message: data.message });
          dispatch({ type: 'selection', selectedRecords: [] });
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
        });
    }
  };

  const ActionMenuItems = () => {
    return (
      <MenuItem
        disabled={selectedRecords.every((e: any) => e?.canDelete) ? false : true}
        onClick={() => {
          if (selectedRecords?.length === 1) {
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
  const resolvedTopRight = typeof topRightSlot === 'function' ? (topRightSlot as Function)() : topRightSlot;

  const statusMenuItems = useMemo(() => {
    return [
      {
        label: CONTENT_PLANNING_STATUS_STATUS.pendingApproval,
        selected: selectedStatus === CONTENT_PLANNING_STATUS_STATUS.pendingApproval,
        value: CONTENT_PLANNING_STATUS_STATUS.pendingApproval,
        startIcon: <HourglassEmpty color="warning" fontSize="small" />
      },
      {
        label: CONTENT_PLANNING_STATUS_STATUS.published,
        selected: selectedStatus === CONTENT_PLANNING_STATUS_STATUS.published,
        value: CONTENT_PLANNING_STATUS_STATUS.published,
        startIcon: <CheckCircle color="success" fontSize="small" />
      },
      {
        label: CONTENT_PLANNING_STATUS_STATUS.scheduled,
        selected: selectedStatus === CONTENT_PLANNING_STATUS_STATUS.scheduled,
        value: CONTENT_PLANNING_STATUS_STATUS.scheduled,
        startIcon: <Schedule color="info" fontSize="small" />
      },
    ] as NewActionButtonProps<string, any>['items'];
  }, [selectedStatus]);

  return (
    <div className="main-container-v1">
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={
            <ButtonMenu
              showChevron={true}
              items={statusMenuItems}
              onItemClick={(e, item) => {
                setSelectedStatus(item.value);
                dispatch({ type: 'pageChange', page: 0 });
              }}
            >
              <span className="flex items-center gap-2 [&_svg]:text-[18px]">Status: {selectedStatus}</span>
            </ButtonMenu>
          }
          rightSideContents={resolvedTopRight}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isEdit: false, idToEdit: null });
          }}
          isAddButtonVisible={permissions?.contentPostPlanning?.isCreate}
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
            resource={sidebarResource.contentPostPlanning}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${
              deleteRecord
                ? `${resources?.contentPostPlanning?.titleSingular?.toLowerCase()} : ${deleteRecord?.title || deleteRecord?.name}`
                : `selected ${resources?.contentPostPlanning?.titlePlural?.toLowerCase()}`
            } ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
            okBtnLoading={deleteLoading}
          />
        )}
      </CustomContainer>

      {showManageDialog.open && (
        <ManageContentPostPlanning
          open={showManageDialog.open}
          isEdit={showManageDialog.isEdit}
          idToEdit={showManageDialog.idToEdit}
          onClose={() => setShowManageDialog({ open: false, isEdit: false, idToEdit: null })}
          onSuccess={(data: any) => {
            // history.push(`${routes.contentPostPlanningDetail.path}/${data._id}`);
            setShowManageDialog({ open: false, isEdit: false, idToEdit: null });
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ListView;
