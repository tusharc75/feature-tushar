import { Box, IconButton, MenuItem } from '@mui/material';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  FIELD_TICKET_STATUS,
  SERVICE_ORDER_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  cloneResourceData,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource
} from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import { findAll, findOne, objectStore } from 'src/constants/indexdbhelper';
import HideWhenOffline from 'src/components/HideWhenOffline';
import { camelCase } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { FiExternalLink } from 'react-icons/fi';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { generateAddFieldTicket, generateFieldTicketActions } from '../walkmeSteps';

const FieldTicket = ({
  serviceOrderData,
  serviceOrderFields = [],
  fetchServiceOrderData,
  setNextStep,
  allowedToEdit,
  handleChangeStatus,
  resource,
  enableGlobalSearch = true
}) => {
  const toastConfig = useContext(CustomToastContext);
  const { setWalkmeData } = useSetWalkmeData();

  const renderedFrom = camelCase(sidebarResource.fieldTicket);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords, dataRows } = state;
  const { generateColumns } = useColumns();

  const [openDialog, setOpenDialog] = useState({ open: false, isClone: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [allFields, setAllFields] = useState([]);

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();
  const [columns, setColumns] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchGridColumns();
    return () => cancelToken.cancel();
  }, []);

  useEffect(() => {
    let stepData = [];
    stepData.push(generateAddFieldTicket(false));
    if (dataRows?.length) {
      stepData.push(...generateFieldTicketActions(0));
    }
    setWalkmeData(stepData);
  }, [dataRows]);

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    fetchData(cancelToken);
    return () => cancelToken.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntity, serviceOrderData]);

  const fetchGridColumns = async (cancelToken?: CancelTokenSource) => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.fieldTicket);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource.fieldTicket}`, { cancelToken: cancelToken?.token });
        data = response?.data?.data;
      }
      setAllFields(JSON.parse(JSON.stringify(data)));
      const newColumns = generateColumns(resources?.fieldTicket?.titlePlural, data, routes.fieldTicketDetail.path);
      newColumns?.forEach((o) => {
        if (o.accessor === 'fieldTicketNumber') {
          o.cell = ({ row }) =>
            row?.original?.fieldTicketNumber ? (
              <div className="flex items-center gap-2">
                <h5
                  className="link text-truncate"
                  onClick={() => {
                    setOpenDialog({ open: true, isClone: false, id: row?.original?._id });
                  }}
                >
                  {row?.original?.fieldTicketNumber}
                </h5>
                <a href={`${routes.fieldTicketDetail.path}/${row?.original?._id}`} target="_blank" rel="noreferrer">
                  <IconButton size="small">
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </a>
              </div>
            ) : (
              <NoDataCell />
            );
        }
      });
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
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  const fetchData = async (cancelToken?: CancelTokenSource) => {
    try {
      setNextStep(false);
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });
      let data, count;

      if (isOffline) {
        data = await findAll(objectStore.fieldTicket);
        data = data?.filter((d) => d?.fieldServiceOrder?.optionValue === serviceOrderData?._id);
        count = data.length;
      } else {
        const queryString = getQueryString();
        const response = await axiosInstance().get(`${routes.fieldTicket.path}${queryString}`, { cancelToken: cancelToken?.token });
        data = response?.data?.data;
        count = response?.data?.count;
      }
      let rows = data?.map((u) => {
        let finalObject = prepareDataForGrid(u);
        finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
        finalObject['allowedToEdit'] =
          permissions?.fieldTicket?.isUpdate &&
          checkIsAllowedToEdit(user, sidebarResource.fieldTicket, u) &&
          ![FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed]?.includes(u?.status);
        finalObject['canDelete'] =
          permissions?.fieldTicket?.isDelete && u?.canDelete && checkIsAllowedToDelete(user, sidebarResource.fieldTicket, u.owner.optionValue);
        let res = {
          ...finalObject
        };
        return res;
      });
      dispatch({ type: 'initialize', data: rows, count: count });
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
      setNextStep(true);
      dispatch({ type: 'loading', loading: false });
    } catch (e) {
      toastConfig.setToastConfig(e);
    }
  };

  const getQueryString = (isExport = false) => {
    // let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    let deepFilter = '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }
    // const { filterByIds, deepFilters } = gridFilterParser(filters);

    const filterByIds = [{ field: 'fieldServiceOrder', term: serviceOrderData?._id }];

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}&filterType=and`;
    }
    // if (deepFilters?.length) {
    //   deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    // }
    // if (filterByIds?.length || deepFilters?.length) {
    //   deepFilter = `${deepFilter}&filterType=and`;
    // }

    // if (sorting.length > 0) {
    //   deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    // }
    // if (search) {
    //   deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    // }
    // if (showFilteredRecordsOnly) {
    //   deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    // }
    return deepFilter;
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.fieldTicket.path}/remove`, { ids: deleteRecord })
      .then(() => {
        fetchData();
        fetchServiceOrderData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={row?.original?.allowedToEdit ? 'Edit' : 'You can not Edit'}>
          <span>
            <IconButton
              disabled={row?.original?.allowedToEdit ? false : true}
              size="small"
              aria-label="Edit"
              onClick={() => {
                setOpenDialog({ open: true, isClone: false, id: row?.original?._id });
              }}
              id={`edit-field-ticket-button-${row.index || 0}`}
            >
              <EditIcon fontSize="small" color={row?.original?.allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HideWhenOffline>
          {!serviceOrderData?.quotation && (
            <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? 'Clone' : cloneDisable}>
              <span>
                <IconButton
                  disabled={permissions?.fieldTicket?.isCreate ? false : true}
                  size="small"
                  aria-label="Clone"
                  onClick={() => {
                    setOpenDialog({ open: true, isClone: true, id: row?.original?._id });
                  }}
                  id={`clone-field-ticket-button-${row.index || 0}`}
                >
                  <FileCopyIcon fontSize="small" color={permissions?.fieldTicket?.isCreate ? 'primary' : 'disabled'} />
                </IconButton>
              </span>
            </HtmlTooltip>
          )}
        </HideWhenOffline>
        <HideWhenOffline>
          <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
            <span>
              <IconButton
                disabled={row?.original?.canDelete ? false : true}
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setDeleteRecord([row?.original?._id]);
                  setShowDeleteConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </HideWhenOffline>
      </>
    )
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          id={'add-field-ticket-menu-item'}
          onClick={() => {
            setOpenDialog({ open: true, isClone: false, id: null });
          }}
        >
          {`Create ${resources?.fieldTicket?.titlePlural}`}
        </MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={!selectedRecords?.every((s) => s.canDelete)}
          onClick={() => {
            setShowDeleteConfirmBox(true);
            setDeleteRecord(selectedRecords.map((d) => d._id));
          }}
          id={'delete-menu-item'}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const getRefrenceData = () => {
    const referenceData: any = cloneResourceData(
      serviceOrderFields?.map((f) => f?.fieldData),
      allFields?.map((f) => f?.fieldData),
      serviceOrderData,
      user.user?.brandCurrency
    );
    referenceData['fieldServiceOrder'] = serviceOrderData?._id;
    return referenceData;
  };

  return (
    <Fragment>
      {resource === sidebarResource.fieldServiceOrder && (
        <DetailsPageHeader
          isAddButtonVisible={allowedToEdit && !serviceOrderData?.quotation}
          addButtonMenuItems={addButtonMenuItems()}
          isActionButtonVisible={!isOffline}
          actionButtonMenuItems={actionButtonMenuItems()}
          actionButtonProps={{ disabled: selectedRecords.length === 0 }}
          hasXpadding
        />
      )}
      {columns ? (
        <CustomReactTable
          height={resource === sidebarResource.fieldServiceOrder ? 'calc(100vh - 393px)' : 'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          enableGlobalSearch={enableGlobalSearch}
          isClientSideGrid={true}
          hideAction={resource === sidebarResource.fieldServiceOrder ? !allowedToEdit : true}
          hideSelection={resource === sidebarResource.fieldServiceOrder ? !allowedToEdit : true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {openDialog.open && (
        <ManageFieldTicket
          id={openDialog.id}
          isClone={openDialog.isClone}
          onClose={() => setOpenDialog({ open: false, isClone: false, id: null })}
          referenceData={getRefrenceData()}
          onSuccess={() => {
            if (serviceOrderData?.status === SERVICE_ORDER_STATUS.new) {
              handleChangeStatus(SERVICE_ORDER_STATUS.inProgress);
            }
            fetchServiceOrderData();
            setOpenDialog({ open: false, isClone: false, id: null });
            fetchData();
          }}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${deleteRecord ? `${resources?.fieldTicket?.titleSingular?.toLowerCase()} : ${deleteRecord?.fieldTicketNumber}` : `selected ${resources?.fieldTicket?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default FieldTicket;
