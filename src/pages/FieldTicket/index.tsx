import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { checkIsAllowedToDelete, getDefaultMyRecordType, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { deleteMany, deleteOne, findAll, findOne, insertUpdate, objectStore } from 'src/constants/indexdbhelper';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageFieldTicket from './ManageFieldTicket';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createFieldTicketFlow } from 'src/pages/FieldTicket/walkmeSteps';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const FieldTicket = () => {
  const {
    state: { permissions, selectedEntity, user, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.fieldTicket?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.fieldTicket?.titlePlural}`,
      value: 2
    }
  ];

  const { setWalkmeData } = useSetWalkmeData();

  const renderedFrom = camelCase(sidebarResource.fieldTicket);

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [fieldTicketId, setFieldTicketId] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const history = useHistory();
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.fieldTicket));
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [columns, setColumns] = useState(null);

  const { generateColumns } = useColumns();
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    fetchGridColumns();
    setWalkmeData([createFieldTicketFlow(resources?.fieldTicket?.titleSingular)]);
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, isOffline, selectedType]);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = await findOne(objectStore.resource, sidebarResource?.fieldTicket);
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
      data = response?.data?.data;
      try {
        insertUpdate(objectStore.resource, sidebarResource?.fieldTicket, data);
      } catch (e) {
        console.error(`Field Ticket: : ${e.message}`);
      }
    }
    const newColumns = generateColumns(renderedFrom, data, routes.fieldTicketDetail.path, true);
    const extraColumns = [];
    extraColumns.push({
      accessor: 'totalAmount',
      Header: 'Total Amount',
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        return row.original?.totalAmount ? (
          <div>
            <p className="text-truncate">{row.original.totalAmount}</p>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    });
    setColumns([...newColumns, ...extraColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (isOffline) {
      const data = await findAll(objectStore.fieldTicket);
      let rows = data?.map((u: any) => {
        let finalObject: any = prepareDataForGrid(u);
        finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
        finalObject['canDelete'] =
          permissions?.fieldTicket?.isDelete && checkIsAllowedToDelete(user, sidebarResource.fieldTicket, finalObject?.ownerId) && u?.canDelete;
        return {
          ...finalObject
        };
      });
      dispatch({ type: 'initialize', data: rows, count: rows?.length || 0 });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    } else {
      axiosInstance()
        .get(`${routes?.fieldTicket.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data, count } }) => {
          let rows = data?.map((u: any) => {
            let finalObject: any = prepareDataForGrid(u);
            finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
            finalObject['canDelete'] =
              permissions?.fieldTicket?.isDelete && checkIsAllowedToDelete(user, sidebarResource.fieldTicket, finalObject?.ownerId) && u?.canDelete;
            return {
              ...finalObject
            };
          });
          dispatch({ type: 'initialize', data: rows, count: count });
        })
        .finally(() => {
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        });
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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
        <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={permissions?.fieldTicket?.isCreate ? false : true}
              onClick={() => {
                setFieldTicketId(row?.original.id);
                setOpen({ open: true, isClone: true });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.fieldTicket?.isCreate ? 'primary' : 'disabled'} />
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

  const handleDelete = async () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    if (isOffline) {
      for (let i = 0; i < ids.length; i++) {
        deleteOne(objectStore.fieldTicket, ids[i]);
        const data = await findOne(objectStore.offlineDataSync, ids[i]);
        if (data?.data?.offlineSyncStatus === 'new') {
          deleteOne(objectStore.offlineDataSync, ids[i]);
        } else {
          await insertUpdate(objectStore.offlineDataSync, ids[i], { type: 'fieldTicket', data: { ...{ _id: ids[i] }, offlineSyncStatus: 'delete' } });
          deleteOne(objectStore.offlineDataSync, `${ids[i]}_submit`);
        }
        let fieldTicketMaterial = await findAll(objectStore.fieldTicketMaterial);
        fieldTicketMaterial = fieldTicketMaterial?.filter((e) => e?.fieldTicketId === ids[i])?.map((e) => e?._id);
        deleteMany(objectStore.fieldTicketMaterial, fieldTicketMaterial);
        deleteMany(objectStore.offlineDataSync, fieldTicketMaterial);
      }
      fetchData();
      setShowDeleteConfirmBox(false);
      setDeleteRecord(null);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Field Ticket Deleted Successfully in Offline!'
      });
    } else {
      axiosInstance()
        .put(`${routes?.fieldTicket?.path}/remove`, { ids: ids })
        .then(({ data }) => {
          dispatch({ type: 'selection', selectedRecords: [] });
          fetchData();
          setShowDeleteConfirmBox(false);
          setDeleteRecord(null);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.fieldTicket?.titlePlural }]} />
        {!isOffline && (
          <ImportExportLinks
            permissions={permissions.fieldTicket}
            module={resources?.fieldTicket?.titlePlural}
            api={'field-ticket'}
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
        )}
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setFieldTicketId(null);
            setOpen({ open: true, isClone: false });
          }}
          isAddButtonVisible={permissions?.fieldTicket.isCreate}
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
            showFilters={!isOffline}
            resource={sidebarResource.fieldTicket}
            isClientSideGrid={isOffline ? true : false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {showDeleteConfirmBox && (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete ${deleteRecord ? `${resources?.fieldTicket?.titleSingular?.toLowerCase()} : ${deleteRecord?.fieldTicketNumber}` : `selected ${resources?.fieldTicket?.titlePlural?.toLowerCase()}`} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )}
        {open?.open && (
          <ManageFieldTicket
            id={fieldTicketId}
            isClone={open?.isClone}
            onClose={() => setOpen({ open: false, isClone: false })}
            onSuccess={() => {
              setOpen({ open: false, isClone: false });
              fetchData();
            }}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default FieldTicket;
