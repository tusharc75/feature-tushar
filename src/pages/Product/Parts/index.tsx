import { useState, useEffect, useContext } from 'react';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import { product } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { Delete, ExpandMore } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { useData } from '../../../StateProvider/Provider';
import AssignProductDialog from '../../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { isMobile, isTablet } from 'react-device-detect';
import { flattenArray } from 'src/constants/columns';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import NoDataCell from 'src/components/Helpers/NoDataCell';

function Parts({ id }) {

  const renderedFrom = `${camelCase(routes?.product.title)}_bom`;
  const {
    state: { permissions }
  }: any = useData();

  const hasPermissions = permissions && permissions[product.permission]?.isUpdate;
  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchBOMData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data: any = [];
    const response = await axiosInstance().get(`/product/${id}/bom`);
    data = response?.data?.data;
    setParts([...data]);
    let rows = data?.map((i, index) => {
      return {
        index: index + 1,
        ...i,
        ...i?.childProductDetail
      }
    })
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  }

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get('/field?resource=Product&view=true');
    const fields = response?.data?.data?.map((e) => e?.fieldData);

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
      }
    ]

    fields?.filter((e) => ['productName']?.includes(e.fieldName))?.forEach((ele) => {
      if (ele?.fieldName === 'productName') {
        coloum.push({
          accessor: 'productName',
          Header: ele?.fieldLabel,
          width: 200,
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="text-truncate">{row.original.productName}</p>
              <Box ml={1}>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.productDetail.path}/${row.original._id}`)
                  }}
                >
                  <OpenInNewIcon fontSize="small" color="primary" />
                </IconButton>
              </Box>
            </div>
          )
        })
      }
    })
    const newColumns = generateColumns(renderedFrom, fields?.filter((e) => ['productDescription', 'productNumber', 'productCategory', 'productCategory']?.includes(e?.fieldName)), null, false, 'USD');

    coloum = [...coloum, ...newColumns, {
      accessor: 'qty',
      Header: 'Qty',
      width: 150,
      editable: permissions?.product?.isUpdate ? true : false,
      Cell: ({ row }) => (row.original?.qty ? <p>{row.original?.qty}</p> : <NoDataCell />)
    }];
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
          {hasPermissions && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => {
                  setShowConfirmBox({ open: true, data: [row.original] });
                }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )
          }
        </>
      )
    })
    setColumns(coloum)
    fetchBOMData();
  };

  const handleRemove = () => {
    setIsDeleting(true);
    closeActions();
    const { data } = showConfirmBox;
    if (data.length > 1) {
      data.forEach((p: any) => {
        axiosInstance()
          .put(`${product.api}/${p.product}/bom/remove`, {
            ids: [p._id]
          })
          .then(() => {
            setIsDeleting(false);
            setShowConfirmBox({ open: false, data: null });
            fetchBOMData();
          })
          .catch((err) => {
            setToastConfig(err);
            setIsDeleting(false);
          });
      });
    } else {
      let d = data[0];
      axiosInstance()
        .put(`${product.api}/${d.product}/bom/remove`, {
          ids: [d._id]
        })
        .then(() => {
          setIsDeleting(false);
          setShowConfirmBox({ open: false, data: null });
          fetchBOMData();
        })
        .catch((err) => {
          setToastConfig(err);
          setIsDeleting(false);
        });
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleSaveData = async (row: any) => {
    axiosInstance()
      .put(`${product.api}/${id}/bom/${row._id}`, { qty: row.qty })
      .then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchBOMData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (rowData && parseInt(inputField['qty']) > 0) {
      handleSaveData({ _id: rowData._id, qty: parseInt(inputField['qty']) });
    }
  }

  const handleAdd = async (rows) => {
    setSubmitting(true)
    const dataObj = rows
      .filter((d) => d.qty > 0)
      .map((d) => {
        return { childProduct: d.id, qty: Number(d.qty) };
      });
    await axiosInstance().post(`/product/${id}/bom`, dataObj)
      .then(({ data }) => {
        if (permissions?.serializedAsset) fetchBOMData();
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenAssignProductDialog(false);
        setSubmitting(false)
      })
      .catch((error) => {
        setToastConfig(error);
        setSubmitting(false)
      });
  };

  return (
    <div>
      {hasPermissions && (
        <Box display="flex" justifyContent="space-between" p={1} pt={2} pb={2}>
          <Button variant="contained" color="primary" size="small" onClick={() => setOpenAssignProductDialog(true)}>
            Add Products
          </Button>
          <Box display={'flex'}>
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="default"
              size="small"
              onClick={openActions}
              disabled={selectedRecords.length ? false : true}
              aria-controls="action-menu"
              style={{ marginLeft: '0.6rem' }}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              {isMobile && !isTablet ? '' : 'Actions'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorEl)}
              onClose={closeActions}
            >
              <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowConfirmBox({ open: true, data: selectedRecords })}>
                Delete
              </MenuItem>
            </Menu>
            <Box ml={1} />
            <Box display="flex" style={{ marginLeft: 'auto' }}>
              <ImportExportMenu
                permissions={permissions?.product}
                module="products"
                api={`${product.api}/unknown/bom`}
                afterImportCompleted={() => {
                  fetchBOMData();
                }}
                isExportAllOrSomeFeature={true}
                ids={[]}
                additionalParams={`productId=${id}`}
              />
            </Box>
          </Box>
        </Box>
      )}
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchBOMData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
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
          ids={[...parts?.map((p) => p.childProduct), id]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default Parts;
