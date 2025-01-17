import { Delete, Edit } from '@mui/icons-material';
import { Box, Dialog, IconButton, MenuItem } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, displayDate, prepareDataForGrid, product, sidebarResource } from 'src/constants/helpers';
import CustomDataDialog from 'src/pages/Product/ScheduledMaintenance/CustomDataDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const ScheduledMaintenance = ({ onClose }) => {
  const renderedFrom = `productScheduledMaintenance`;
  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [openCustomDataDialog, setOpenCustomDataDialog] = useState({ open: false, data: null });
  const [rowsToAdd, setRowsToAdd] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, dataRows, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
    const fields = response?.data?.data?.map((e) => e?.fieldData);

    let coloum: any = [];

    fields
      ?.filter((e) => ['productName']?.includes(e.fieldName))
      ?.forEach((ele) => {
        if (ele?.fieldName === 'productName') {
          coloum.push({
            accessor: 'productName',
            Header: ele?.fieldLabel,
            width: 200,
            Cell: ({ row }) => (
              <div className="flex items-center gap-2">
                <p className="text-truncate">{row.original.productName}</p>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row?.original?.productId}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            )
          });
        }
      });
    const newColumns = generateColumns(
      renderedFrom,
      fields?.filter((e) => ['productDescription', 'productNumber']?.includes(e?.fieldName))
    );

    coloum = [
      ...coloum,
      ...newColumns,
      {
        accessor: 'effectiveDate',
        Header: 'Effective Date',
        width: 200,
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => (row.original?.effectiveDate ? <p>{displayDate(row.original?.effectiveDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'duration',
        Header: 'Duration',
        width: 200,
        Cell: ({ row }) => (row.original?.duration ? <p>{row.original?.duration}</p> : <NoDataCell />)
      }
    ];
    coloum.push({
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
          <HtmlTooltip title="Edit">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setOpenCustomDataDialog({ open: true, data: row?.original });
                }}
              >
                <Edit fontSize="small" color="primary" />
              </IconButton>
            </span>
          </HtmlTooltip>
          <HtmlTooltip title="Delete">
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  setShowConfirmBox({ open: true, data: [row.original] });
                }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </span>
          </HtmlTooltip>
        </>
      )
    });
    setColumns([...coloum, ...getStaticFields()]);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, limit, filters, sorting, search, showFilteredRecordsOnly]);

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${product.api}/scheduledMaintenance${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data.map((u, index) => {
            let res: any = {
              ...prepareDataForGrid(u)
            };
            res.productName = u?.productDetail?.optionLabel || '';
            res.productId = u?.productDetail?.optionValue || '';
            res.productDescription = u?.productDetail?.productDescription || '';
            res.productNumber = u?.productDetail?.productNumber || '';
            return res;
          });
          dispatch({ type: 'initialize', data: rows, count: count });
          dispatch({ type: 'loading', loading: false });
        }
      )
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        setToastConfig(err);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';

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

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const handleAdd = (_data) => {
    if (rowsToAdd?.length && _data) {
      setIsSubmitting(true);
      axiosInstance()
        .post(`${product.api}/scheduledMaintenance`, {
          products: rowsToAdd?.map((r) => r?._id),
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration
        })
        .then(({ data }) => {
          fetchData();
          setIsSubmitting(false);
          setOpenCustomDataDialog({ open: false, data: null });
          setOpenAssignProductDialog(false);
          setRowsToAdd([]);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setToastConfig(error);
        });
    } else if (_data && openCustomDataDialog?.data?._id) {
      setIsSubmitting(true);
      axiosInstance()
        .put(`${product.api}/scheduledMaintenance`, {
          _id: openCustomDataDialog?.data?._id,
          effectiveDate: _data?.effectiveDate,
          duration: _data?.duration
        })
        .then(({ data }) => {
          fetchData();
          setIsSubmitting(false);
          setOpenCustomDataDialog({ open: false, data: null });
          setOpenAssignProductDialog(false);
        })
        .catch((error) => {
          setIsSubmitting(false);
          setToastConfig(error);
        });
    }
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    axiosInstance()
      .put(`${product.api}/scheduledMaintenance/remove`, {
        ids: data?.map((d) => d?._id)
      })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        setIsDeleting(false);
        setShowConfirmBox({ open: false, data: null });
        fetchData();
      })
      .catch((err) => {
        setToastConfig(err);
        setIsDeleting(false);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenAssignProductDialog(true)}>Add Existing Products</MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        <ImportExportMenu
          permissions={permissions?.product}
          module="productScheduledMaintenance"
          api={`${product.api}/scheduledMaintenance`}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
        />
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={onClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Setup Schedule Maintenance`} showManimizeMaximize={false} showRequiredLabel={false} onClose={onClose} />
      <CustomDialogContent isFooterPresent={false}>
        <>
          <DetailsPageHeader
            isAddButtonVisible={true}
            addButtonMenuItems={addButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              showOnlyShowFilteredRecordSwitch={true}
              showFilters={false}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
        {openAssignProductDialog && (
          <AssignProductDialog
            handleCloseDialog={() => setOpenAssignProductDialog(false)}
            onSuccess={(rows) => {
              setRowsToAdd(rows);
              setOpenCustomDataDialog({ open: true, data: null });
            }}
            serialized={true}
            isSubmitting={false}
            ids={dataRows?.map((d) => d?.productId)}
          />
        )}

        {openCustomDataDialog.open && (
          <CustomDataDialog
            data={openCustomDataDialog?.data}
            handleClose={() => {
              setOpenCustomDataDialog({ open: false, data: null });
            }}
            handleSave={(_data) => {
              handleAdd(_data);
            }}
            loading={isSubmitting}
          />
        )}

        {showConfirmBox.open && (
          <ConfirmationDialogRaw
            open={true}
            message={`Are you sure you want to delete this product(s)?`}
            okBtnLoading={isDeleting}
            onClose={() => {
              setShowConfirmBox({ open: false, data: null });
            }}
            onOk={handleRemove}
          />
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default ScheduledMaintenance;
