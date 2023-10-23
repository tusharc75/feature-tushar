import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { camelCase, set } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { generateCustomTableColumns } from 'src/constants/columns';
import { prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { Add } from '@material-ui/icons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import ManageCreditMemo from 'src/pages/CreditMemo/ManageCreditMemo';
import { useData } from 'src/StateProvider/Provider';

function CreditMemo({ invoiceData, allowedToEdit }) {

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(routes?.invoice.title)}_credit_memo`;

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  const [selectedRecords, setSelectedRecords] = useState([]);

  const [creditMemoDialog, setCreditMemoDialog] = useState({ open: false, id: null });
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState({ open: false, ids: [] });
  const [isDeleting, setIsDeleting] = useState(false);


  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  useEffect(() => {
    fetchFields();
    fetchData();
  }, []);

  const fetchFields = async () => {
    try {
      const { data: { data } } = await axiosInstance().get(`/field?resource=${sidebarResource.creditMemo}`);
      data?.forEach((e) => {
        e.isColumnEditable = false;
      });
      const columns = generateCustomTableColumns(data?.filter((e) => !['invoice']?.includes(e?.fieldData?.fieldName))?.map((e) => e.fieldData), invoiceData?.currency, renderedFrom);
      columns?.forEach((e) => {
        if (e.accessor === 'creditMemoNumber') {
          e.Cell = ({ row }) =>
            row.original['creditMemoNumber'] ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {allowedToEdit ? (
                  <p
                    onClick={() => {
                      setCreditMemoDialog({ open: true, id: row.original._id });
                    }}
                    className="link text-truncate"
                    title={row.original['creditMemoNumber']}
                  >
                    {row.original['creditMemoNumber']}
                  </p>
                ) : (
                  <p className="text-truncate">{row.original['creditMemoNumber']}</p>
                )}
              </div>
            ) : (
              <NoDataCell />
            )
        }
      })
      columns.push({
        accessor: 'action',
        Header: 'Actions',
        minWidth: 100,
        width: 100,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }) => (
          <>
            {allowedToEdit && permissions?.creditMemo?.isUpdate &&
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
            }
            {allowedToEdit && permissions?.creditMemo?.isDelete &&
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
            }
          </>
        )
      });
      setColumns([...columns]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    const query = `?filterById=${JSON.stringify([{ field: 'invoice', term: { $in: [invoiceData?._id] } }])}&&filterType=and`
    axiosInstance().get(`${routes?.creditMemo.path}${query}`)
      .then(({ data: { data } }) => {
        let rows = data?.data?.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          return finalObject;
        })
        setRowsData(rows)
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

  return (
    <Fragment>
      <Box pb={2} justifyContent={'space-between'} className="flex gap-2">
        {allowedToEdit && permissions?.creditMemo?.isCreate &&
          <Button
            variant={'outlined'}
            color="primary"
            size="small"
            startIcon={<Add />}
            onClick={() => setCreditMemoDialog({ open: true, id: null })}
          >
            Create
          </Button>
        }
        {allowedToEdit &&
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
        }
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
        <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'} pt={1}>
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            data={rowsData}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={allowedToEdit ? false : true}
            hideAction={allowedToEdit ? false : true}
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
      {creditMemoDialog.open && (
        <ManageCreditMemo
          isClone={false}
          onClose={() => setCreditMemoDialog({ open: false, id: null })}
          onSuccess={() => {
            setCreditMemoDialog({ open: false, id: null });
            fetchData();
          }}
          id={creditMemoDialog.id}
          referenceData={{
            invoice: invoiceData?._id,
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
