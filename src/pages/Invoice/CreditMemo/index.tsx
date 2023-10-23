import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { camelCase, set } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { generateCustomTableColumns } from 'src/constants/columns';
import { dateFormat, invoice, sidebarResource } from 'src/constants/helpers';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import { Add } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ManageCreditMemo from 'src/pages/CreditMemo/ManageCreditMemo';
import moment from 'moment';

function CreditMemo({ invoiceData }) {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(routes?.invoice.title)}_credit_memo`;

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [selectedRecords, setSelectedRecords] = useState([]);

  const [createCreditMemoDialog, setCreateCreditMemoDialog] = useState({ open: false, id: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, ids: [] });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${sidebarResource.creditMemo}`);
      const columns = [];
      data?.forEach((field) => {
        columns.push({
          accessor: field?.fieldData?.fieldName,
          Header: field?.fieldData?.fieldLabel,
          width: 200,
          disableFilters: field?.fieldData.type === 'date' ? true : false,
          Cell: ({ row }) =>
            row.original[field?.fieldData?.fieldName] ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <p className="text-truncate">
                  {field?.fieldData.type === 'date'
                    ? moment(row.original[field?.fieldData?.fieldName]).format(dateFormat)
                    : row.original[field?.fieldData?.fieldName]}
                </p>
                {(field?.fieldData?.fieldName === 'creditMemoNumber' || field?.fieldData?.fieldName === 'invoice') && (
                  <Box ml={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (field?.fieldData?.fieldName === 'creditMemoNumber') {
                          window.open(`${routes.creditMemoDetail.path}/${row.original._id}`);
                        } else if (field?.fieldData?.fieldName === 'invoice') {
                          window.open(`${routes.invoiceDetail.path}/${row.original.invoiceid}`);
                        }
                      }}
                    >
                      <OpenInNewIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                )}
              </div>
            ) : (
              <NoDataCell />
            )
        });
      });
      columns.push({
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row, rows }) => (
          <>
            <HtmlTooltip title={'Edit'}>
              <IconButton
                size="small"
                aria-label="Delete"
                onClick={() => {
                  setCreateCreditMemoDialog({ open: true, id: row.original._id });
                }}
              >
                <EditIcon fontSize="small" color={'primary'} />
              </IconButton>
            </HtmlTooltip>
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
          </>
        )
      });
      setColumns([...columns]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    const {
      data: { data }
    } = await axiosInstance().get(`${routes?.creditMemo.path}?filterById=${JSON.stringify([{field: 'invoice', term:{$in:[invoiceData?.invoiceId]}}])}&&filterType=and`);
    const rowData = data?.data;
    rowData?.forEach((ele) => {
      ele.invoiceid = ele?.invoice?.optionValue || '';
      ele.invoice = ele?.invoice?.optionLabel || '';
    });
    setRowsData(rowData);
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

  return (
    <Fragment>
      <Box pb={2} justifyContent={'space-between'} className="flex gap-2">
        <Button
          variant={'outlined'}
          color="primary"
          size="small"
          startIcon={<Add />}
          onClick={() => setCreateCreditMemoDialog({ open: true, id: null })}
        >
          Create
        </Button>
        <Button
          variant={'outlined'}
          color="primary"
          aria-controls="simple-menu"
          aria-haspopup="true"
          disabled={selectedRecords.length === 0}
          size="small"
          onClick={handleClick}
          endIcon={<ArrowDropDownIcon />}
          className="new-dropdown-v1"
        >
          {'Actions'}
        </Button>
        <Menu
          anchorEl={anchorActionEl}
          keepMounted
          open={Boolean(anchorActionEl)}
          onClose={handleClose}
          getContentAnchorEl={null}
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
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'} height={'calc(100vh - 285px)'} pt={1}>
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            data={rowsData}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={false}
            hideAction={false}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {createCreditMemoDialog.open && (
        <ManageCreditMemo
          isClone={false}
          onClose={() => setCreateCreditMemoDialog({ open: false, id: null })}
          onSuccess={() => {
            setCreateCreditMemoDialog({ open: false, id: null });
            fetchData();
          }}
          id={createCreditMemoDialog.id}
          referenceData={{
            invoice: invoiceData?.invoiceId,
            currency: invoiceData?.currency
          }}
          isRedirectToDetailPage={false}
        />
      )}
      {showDeleteConfirmBox.open && (
        <ConfirmationDialog
          open={showDeleteConfirmBox.open}
          message={`Are you sure you want to delete the credit memo ${showDeleteConfirmBox.ids.length > 1 ? '(s)' : ''}
                     ?`}
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
