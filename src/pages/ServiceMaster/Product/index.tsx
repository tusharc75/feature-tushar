import { useState, useEffect, useContext } from 'react';
import { Box, Grid, Button, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { serviceMaster, sidebarResource } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { ExpandMore } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useData } from '../../../StateProvider/Provider';
import AssignProductDialog from '../../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = `${camelCase(sidebarResource?.serviceMaster)}_product`;

function Product({ id }) {
  const isMobile = useMediaQuery('(max-width:600px)');
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const {
    state: { permissions }
  }: any = useData();

  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);

  const [columns, setColumns] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [isSubmitting, setSubmitting] = useState(false);

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  useEffect(() => {
    fetchGridColumns();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${serviceMaster.api}/product/${id}`)
      .then(({ data: { data } }) => {
        const rows = data?.map((e) => ({ ...e, ...(e?.productDetail || {}) }));
        setParts([...data]);
        dispatch({
          type: 'initialize',
          data: rows,
          count: rows?.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = async () => {
    const column: any = [
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: permissions?.serviceMaster?.isUpdate ? true : false,
        width: 70,
        minWidth: 70,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      }
    ];
    const productResult = await axiosInstance().get('/field?resource=Product');
    productResult?.data?.data
      ?.filter((e) =>
        ['productName', 'productNumber', 'productDescription', 'productCategory', 'serializedProduct'].includes(e?.fieldData?.fieldName)
      )
      ?.map((field) => {
        if (field?.fieldData?.fieldName === 'productCategory') {
          column.push({
            accessor: field?.fieldData?.fieldName,
            Header: field?.fieldData?.fieldLabel,
            width: 100,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p>{row.original?.productDetail[field?.fieldData?.fieldName]?.optionLabel || <NoDataCell />}</p>
              </div>
            )
          });
        } else if (field?.fieldData?.fieldName === 'serializedProduct') {
          column.push({
            accessor: field?.fieldData?.fieldName,
            Header: field?.fieldData?.fieldLabel,
            width: 100,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p>{row.original?.productDetail[field?.fieldData?.fieldName] ? 'Yes' : 'No' || <NoDataCell />}</p>
              </div>
            )
          });
        } else if (field?.fieldData?.fieldName === 'productName') {
          column.push({
            accessor: field?.fieldData?.fieldName,
            Header: field?.fieldData?.fieldLabel,
            width: 100,
            Cell: ({ row }) =>
              row?.original?.productName ? (
                <div className="flex items-center gap-2">
                  <p className="text-truncate">{row.original.productName}</p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.productDetail.path}/${row.original.product}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              ) : (
                <NoDataCell />
              )
          });
        } else {
          column.push({
            accessor: field?.fieldData?.fieldName,
            Header: field?.fieldData?.fieldLabel,
            width: 100,
            Cell: ({ row }) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p>{row.original?.productDetail[field?.fieldData?.fieldName] || <NoDataCell />}</p>
              </div>
            )
          });
        }
      });

    column.push({
      accessor: 'action',
      Header: 'Actions',
      width: 70,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }: any) => (
        <div style={{ display: 'flex', justifyContent: 'end' }}>
          {permissions?.serviceMaster?.isUpdate && (
            <HtmlTooltip title="Delete">
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setShowConfirmBox({ open: true, data: [row.original] });
                }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </HtmlTooltip>
          )}
        </div>
      )
    });
    setColumns([...column]);
  };

  const handleRemove = () => {
    setIsDeleting(true);
    const { data } = showConfirmBox;
    if (data.length > 1) {
      data.forEach((p: any) => {
        axiosInstance()
          .put(`${serviceMaster.api}/product/${id}/remove`, {
            ids: [p?.productDetail?._id]
          })
          .then(() => {
            setIsDeleting(false);
            setShowConfirmBox({ open: false, data: null });
            fetchData();
          })
          .catch((err) => {
            setToastConfig(err);
            setIsDeleting(false);
          });
      });
    } else {
      let d = data[0];
      axiosInstance()
        .put(`${serviceMaster.api}/product/${id}/remove`, {
          ids: [d?.productDetail?._id]
        })
        .then(() => {
          setIsDeleting(false);
          setShowConfirmBox({ open: false, data: null });
          fetchData();
        })
        .catch((err) => {
          setToastConfig(err);
          setIsDeleting(false);
        });
    }
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const dToUpdate = {
      ...inputField,
      service: updatedData?.service,
      product: updatedData?.product
    };
    axiosInstance()
      .put(`${serviceMaster.api}/product/${id}/qty`, dToUpdate)
      .then(({ data }) => {
        setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        fetchData();
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    const productObj = rows
      .filter((d) => d.qty > 0)
      .map((d) => {
        return {
          product: d.id,
          qty: Number(d.qty)
        };
      });

    await axiosInstance()
      .post(`${serviceMaster.api}/product/${id}`, productObj)
      .then(({ data }) => {
        fetchData();
        setToastConfig({
          open: true,
          message: data.message,
          severity: 'success'
        });
        setOpenAssignProductDialog(false);
        setSubmitting(false);
      })
      .catch((error) => {
        setSubmitting(false);
        setToastConfig(error);
      });
  };

  const rightSideContents = () => {
    return (
      <>
        {isMobile ? null : (
          <ImportExportMenu
            permissions={permissions?.packages}
            module="products"
            api={`${serviceMaster.api}/product/${id}`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            total={selectedRecords.length}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords?.length ? selectedRecords?.map((obj) => obj._id) : []}
            additionalParams={`serviceId=${id}`}
          />
        )}
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setShowConfirmBox({ open: true, data: selectedRecords });
            closeActions();
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <div>
      {permissions?.serviceMaster?.isUpdate && (
        <>
          <DetailsPageHeader
            isAddButtonVisible
            addButtonMenuItems
            addButtonProps={{ onClick: () => setOpenAssignProductDialog(true) }}
            isActionButtonVisible
            actionButtonMenuItems={actionButtonMenuItems()}
            actionButtonProps={{ disabled: selectedRecords.length === 0 }}
            rightSideContents={rightSideContents()}
            hasXpadding={false}
          />
        </>
      )}
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          refreshGrid={fetchData}
          onSaveEdit={onSaveInlineEdit}
          hideAction={permissions?.serviceMaster?.isUpdate ? false : true}
          hideSelection={permissions?.serviceMaster?.isUpdate ? false : true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
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
      {openAssignProductDialog && (
        <AssignProductDialog
          handleCloseDialog={() => setOpenAssignProductDialog(false)}
          ids={[...parts?.map((p) => p.product), id]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          serialized={false}
          extraDeepFilter={[{ field: 'expenseItem', term: 'No' }]}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default Product;
