import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import { camelCase, startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Add } from '@mui/icons-material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import ManageCreditMemo from 'src/pages/CreditMemo/ManageCreditMemo';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import PreviewDownload from 'src/components/PreviewDownload';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { isMobile, isTablet } from 'react-device-detect';
import MaterialDialog from './MaterialDialog';
import { FiExternalLink } from 'react-icons/fi';
import { ThemeButton } from 'src/components/Helpers/Buttons';

function CreditMemo({ invoiceData, allowedToEdit }) {
  const renderedFrom = `${camelCase(sidebarResource.invoice)}_credit_memo`;
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);
  const [creditMemoDialog, setCreditMemoDialog] = useState({ open: false, id: null });
  const [creditMemoMaterialDialog, setCreditMemoMaterialDialog] = useState({ open: false, data: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, ids: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [invoiceColumns, setInvoiceColumns] = useState(null);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  useEffect(() => {
    fetchFields();
    fetchInvoiceFields();
    fetchData();
  }, []);

  const fetchInvoiceFields = async () => {
    try {
      let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, false);
      const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency);
      let coloum: any = [
        {
          accessor: 'index',
          Header: 'Index',
          width: 70,
          sticky: 'left',
          Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
          Footer: () => {
            return <>Total</>;
          }
        },
        {
          accessor: 'type',
          Header: 'Type',
          sticky: isMobile || isTablet ? 'none' : 'left',
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p>{startCase(row.original?.type)}</p>
            </div>
          )
        },
        {
          accessor: 'detail',
          Header: 'Detail',
          disabled: true,
          minWidth: 300,
          sticky: isMobile || isTablet ? 'none' : 'left',
          width: 300,
          Cell: ({ row }) =>
            row?.original?.type ? (
              <div className="flex items-center gap-2">
                {row?.original?.detail ? <p className="text-truncate">{row.original.detail}</p> : <NoDataCell />}
              </div>
            ) : (
              <NoDataCell />
            )
        },
        {
          accessor: 'description',
          Header: 'Description',
          width: 200,
          Cell: ({ row }) => {
            return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
          }
        }
      ];
      coloum = [...coloum, ...newColumns];
      setInvoiceColumns(coloum);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${sidebarResource.creditMemo}`);
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const columns = generateColumns(
        renderedFrom,
        data?.filter((e) => !['invoice']?.includes(e?.fieldData?.fieldName))?.map((e) => e.fieldData),
        null,
        false,
        invoiceData?.currency
      );
      columns?.forEach((e) => {
        if (e.accessor === 'creditMemoNumber') {
          e.cell = ({ row }) =>
            row.original['creditMemoNumber'] ? (
              <div className="flex items-center gap-2">
                <p
                  onClick={() => {
                    setCreditMemoMaterialDialog({ open: true, data: row.original });
                  }}
                  className="link text-truncate"
                  title={row.original['creditMemoNumber']}
                >
                  {row.original['creditMemoNumber']}
                </p>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.creditMemoDetail.path}/${row.original._id}`);
                  }}
                >
                  <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                </IconButton>
              </div>
            ) : (
              <NoDataCell />
            );
        }
      });
      columns.push({
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
            {allowedToEdit && permissions?.creditMemo?.isUpdate && (
              <HtmlTooltip title={'Edit'}>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => {
                    setCreditMemoDialog({ open: true, id: row.original._id });
                  }}
                >
                  <EditIcon fontSize="small" color={'primary'} />
                </IconButton>
              </HtmlTooltip>
            )}
            {allowedToEdit && permissions?.creditMemo?.isDelete && (
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setShowDeleteConfirmBox({
                    open: true,
                    ids: [row.original._id]
                  });
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            )}
          </>
        )
      });
      setColumns([
        {
          accessor: 'index',
          Header: 'Index',
          width: 70,
          sticky: 'left',
          Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
          Footer: () => {
            return <>Total</>;
          }
        },
        ...columns
      ]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    const query = `?filterById=${JSON.stringify([{ field: 'invoice', term: { $in: [invoiceData?._id] } }])}&&filterType=and`;
    axiosInstance()
      .get(`${routes?.creditMemo.path}${query}`)
      .then(({ data: { data } }) => {
        let rows = data?.data?.map((u, i) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['index'] = i + 1;
          return finalObject;
        });

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async (ids) => {
    setIsDeleting(true);
    try {
      const data = await axiosInstance().put(`${routes?.creditMemo?.path}/remove`, { ids: ids });
      setIsDeleting(false);
      setShowDeleteConfirmBox({
        open: false,
        ids: []
      });
      toastConfig.setToastConfig({
        open: true,
        message: data?.data?.message || 'Deleted successfully',
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      setIsDeleting(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleClick = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorActionEl(null);
  };

  const previewDownloadProps = {
    fileName: `${resources?.invoice?.titleSingular}-${invoiceData?.invoiceNumber}`,
    resource: sidebarResource.invoice,
    referenceId: invoiceData?._id,
    columns: invoiceColumns,
    isSendEmail: false,
    extraQueryParams: { isCreditMemo: true },
    defaultColumns: [
      'type',
      'detail',
      'fieldTicket',
      'qty',
      'unit',
      'pricingMethod',
      'actualStartDate',
      'actualEndDate',
      `price_${invoiceData?.currency?.toLowerCase()}`,
      `totalPrice_${invoiceData?.currency?.toLowerCase()}`,
      `taxPercentage`,
      `tax_${invoiceData?.currency?.toLowerCase()}`,
      `finalPrice_${invoiceData?.currency?.toLowerCase()}`
    ]
  };

  return (
    <Fragment>
      <Box pb={2} justifyContent={'space-between'} className="flex gap-2">
        {allowedToEdit && permissions?.creditMemo?.isCreate && (
          <ThemeButton startIcon={<Add />} iconForMobile={<Add />} mobileTooltip='Create' onClick={() => setCreditMemoDialog({ open: true, id: null })}>
            Create
          </ThemeButton>
        )}
        <div className="flex items-center gap-2">
          {invoiceColumns && dataRows?.length > 0 && <PreviewDownload {...previewDownloadProps} />}
          {allowedToEdit && (
            <ThemeButton
              disabled={selectedRecords.length === 0}
              onClick={handleClick}
              endIcon={<ArrowDropDownIcon />}
              mobileTooltip="Actions"
              borderColor="yellow"
              backgroundColor="yellow"
              iconForMobile={<ArrowDropDownIcon />}            >
              {'Actions'}
            </ThemeButton>
          )}
        </div>
        <Menu
          anchorEl={anchorActionEl}
          keepMounted
          open={Boolean(anchorActionEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
        >
          <MenuItem
            disabled={selectedRecords.length === 0 || isDeleting}
            onClick={() => {
              setShowDeleteConfirmBox({
                open: true,
                ids: selectedRecords.map((item) => item._id)
              });
              handleClose();
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      </Box>
      {columns ? (
        <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'} pt={1}>
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideSelection={allowedToEdit ? false : true}
            hideAction={allowedToEdit ? false : true}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {creditMemoDialog.open && (
        <ManageCreditMemo
          isClone={false}
          onClose={() => setCreditMemoDialog({ open: false, id: null })}
          onSuccess={() => {
            setCreditMemoDialog({ open: false, id: null });
            fetchData();
          }}
          creditMemoId={creditMemoDialog.id}
          invoiceData={invoiceData}
          isRedirectToDetailPage={false}
        />
      )}
      {creditMemoMaterialDialog.open && (
        <MaterialDialog
          creditMemoDetail={creditMemoMaterialDialog.data}
          handleClose={() => setCreditMemoMaterialDialog({ open: false, data: null })}
          allowedToEdit={allowedToEdit}
        />
      )}
      {showDeleteConfirmBox.open && (
        <ConfirmationDialog
          open={showDeleteConfirmBox.open}
          message={`Are you sure you want to delete the credit memo ${showDeleteConfirmBox.ids.length > 1 ? '(s)' : ''}?`}
          onClose={() => {
            setShowDeleteConfirmBox({ open: false, ids: [] });
          }}
          okBtnLoading={isDeleting}
          onOk={() => {
            handleDelete(showDeleteConfirmBox.ids);
          }}
        />
      )}
    </Fragment>
  );
}

export default CreditMemo;
