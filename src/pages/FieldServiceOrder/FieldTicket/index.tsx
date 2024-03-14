import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
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
import { FIELD_TICKET_STATUS, SERVICE_ORDER_STATUS, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';

const FieldTicket = ({ serviceOrderData, setNextStep, renderedFrom, allowedToEdit, handleChangeStatus }) => {
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [openDialog, setOpenDialog] = useState({ open: false, isClone: false, id: null });
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedEntity, serviceOrderData]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.fieldTicket}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(routes.fieldTicket?.title, data, routes.fieldTicketDetail.path);
        newColumns?.forEach((o) => {
          if (o.accessor === 'fieldTicketNumber') {
            o.cell = ({ row }) =>
              row?.original?.fieldTicketNumber ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h5
                    className="link text-truncate"
                    onClick={() => {
                      setOpenDialog({ open: true, isClone: false, id: row?.original?._id });
                    }}
                  >
                    {row?.original?.fieldTicketNumber}
                  </h5>
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        window.open(`${routes.fieldTicketDetail.path}/${row?.original?._id}`);
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                </div>
              ) : (
                <NoDataCell />
              );
          }
        });
        setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
      });
  };

  const fetchData = () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes.fieldTicket.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          var isAllowedToEdit = [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          finalObject['allowedToEdit'] =
            isAllowedToEdit && permissions?.fieldTicket?.isUpdate && ![FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed]?.includes(u?.status);
          finalObject['canDelete'] =
            u?.canDelete &&
            permissions?.fieldTicket?.isDelete &&
            u?.owner?.optionValue === user?.user?._id &&
            ![FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed]?.includes(u?.status);
          let res = {
            ...finalObject
          };
          return res;
        });
        dispatch({
          type: 'initialize',
          data: rows,
          count: count
        });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
        setNextStep(true);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
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
        <HtmlTooltip title={row?.original?.allowedToEdit ? 'Edit' : 'You can not Delete'}>
          <span>
            <IconButton
              disabled={row?.original?.allowedToEdit ? false : true}
              size="small"
              aria-label="Edit"
              onClick={() => {
                setOpenDialog({ open: true, isClone: false, id: row?.original?._id });
              }}
            >
              <EditIcon fontSize="small" color={row?.original?.allowedToEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        {!serviceOrderData?.quotation &&
          <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? 'Clone' : cloneDisable}>
            <span>
              <IconButton
                disabled={permissions?.fieldTicket?.isCreate ? false : true}
                size="small"
                aria-label="Clone"
                onClick={() => {
                  setOpenDialog({ open: true, isClone: true, id: row?.original?._id });
                }}
              >
                <FileCopyIcon fontSize="small" color={permissions?.fieldTicket?.isCreate ? 'primary' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        }
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
      </>
    )
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setOpenDialog({ open: true, isClone: false, id: null });
          }}
        >
          {`Create ${routes.fieldTicket.title}`}
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
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit && !serviceOrderData?.quotation}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={true}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: selectedRecords.length === 0 }}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          isClientSideGrid={true}
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
          referenceData={{
            fieldServiceOrder: serviceOrderData?._id,
            warehouse: serviceOrderData?.warehouse?.optionValue || '',
            wellName: serviceOrderData?.wellName?.optionValue || '',
            wellNumber: serviceOrderData?.wellNumber?.map((m) => m.optionValue) || [],
            numberOfWells: serviceOrderData?.numberOfWells,
            estimateStartDate: serviceOrderData?.estimateStartDate || '',
            estimateEndDate: serviceOrderData?.estimateEndDate || '',
            customerAccount: serviceOrderData?.customerAccount?.optionValue || '',
            billingAddress: serviceOrderData?.billingAddress?.optionValue || '',
            shippingAddress: serviceOrderData?.shippingAddress?.optionValue || '',
            taxCode: serviceOrderData?.taxCode?.optionValue || '',
            pricingCondition: serviceOrderData?.pricingCondition?.optionValue || '',
            collaborator: serviceOrderData?.collaborator?.map((m) => m.optionValue) || []
          }}
          onSuccess={() => {
            if (serviceOrderData?.status === SERVICE_ORDER_STATUS.new) {
              handleChangeStatus(SERVICE_ORDER_STATUS.inProgress);
            }
            setOpenDialog({ open: false, isClone: false, id: null });
            fetchData();
          }}
          renderedFrom={renderedFrom}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${routes.fieldTicket?.title?.toLowerCase()} ?`}
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
