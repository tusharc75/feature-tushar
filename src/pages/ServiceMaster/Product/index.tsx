import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Box, Grid, Button, Menu, MenuItem, Link } from '@material-ui/core';
import { getLocalStorageArrayData, serviceMaster } from '../../../constants/helpers';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { ExpandMore } from '@material-ui/icons';
import { IconButton, Tooltip } from '@material-ui/core';
import { useData } from '../../../StateProvider/Provider';
import { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import AssignProductDialog from '../../../components/AssignRolesDialog/AssignProductDialog';
import ConfirmationDialogRaw from '../../../components/Helpers/ConfirmationDialog';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { isMobile } from 'react-device-detect';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';

function Product({ id }) {
  const renderedFrom = `${camelCase(routes?.serviceMaster.title)}_product`;
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);

  const [columns, setColumns] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [dataRows, setDataRows] = useState([]);

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
    axiosInstance()
      .get(`${serviceMaster.api}/product/${id}`)
      .then(({ data: { data } }) => {
        setDataRows(data);
        setParts([...data]);
      })
      .catch((err) => {});
  };

  const fetchGridColumns = () => {
    const column: any = [
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: permissions?.serviceMaster?.isUpdate ? true : false,
        width: 70,
        minWidth: 70,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>
      },
      {
        accessor: 'productName',
        Header: 'Product Name',
        minWidth: 100,
        Cell: ({ row }) => (
          <Link
            className="link"
            title={row.original?.productDetail?.productName}
            href={`${routes.productDetail.path}/${row.original?.productDetail?._id}`}
          >
            {row.original?.productDetail?.productName || <NoDataCell />}
          </Link>
        )
      },
      {
        accessor: 'productNumber',
        Header: 'Product Number',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original?.productDetail?.productNumber || <NoDataCell />}</p>
          </div>
        )
      },
      {
        accessor: 'productDescription',
        Header: 'Product Description',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original?.productDetail?.productDescription || <NoDataCell />}</p>
          </div>
        )
      },
      {
        accessor: 'productCategory',
        Header: 'Product Category',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{row.original?.productDetail?.productCategory?.optionLabel || <NoDataCell />}</p>
          </div>
        )
      },
      {
        accessor: 'serializedProduct',
        Header: 'Serialized Product',
        width: 70,
        Cell: ({ row }) => <p className="text-truncate">{row.original?.serializedProduct ? 'Yes' : 'No' || <NoDataCell />}</p>
      }
    ];

    column.push({
      accessor: 'action',
      Header: 'Action',
      width: 50,
      sticky: 'right',
      disableFilters: true,
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
      .then((e) => {
        fetchData();
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

  return (
    <div>
      {permissions?.serviceMaster?.isUpdate && (
        <Box p={1}>
          <Grid container>
            <Grid item xs={6} md={6} sm={6}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => {
                  setOpenAssignProductDialog(true);
                }}
              >
                Add Product
              </Button>
            </Grid>
            <Grid item xs={6} md={6} sm={6}>
              <Box display={'flex'} justifyContent={'flex-end'}>
                <Button
                  variant="outlined"
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  disabled={selectedRecords.length === 0}
                  endIcon={<ExpandMore />}
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorActionEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorActionEl)}
                  onClose={closeActions}
                >
                  <MenuItem
                    onClick={() => {
                      setShowConfirmBox({ open: true, data: selectedRecords });
                      // closeActions();
                      // setShowConfirmBox({ open: true, ids: selectedRecords?.map((e) => e._id) });
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
                <Box ml={1} />
                <ImportExportMenu
                  permissions={permissions?.packages}
                  module="packages-products"
                  api={`${serviceMaster.api}/product/${id}`}
                  afterImportCompleted={() => {
                    fetchData();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={selectedRecords.length}
                  recordsToExport={selectedRecords.length}
                  ids={
                    getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                      ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                      : []
                  }
                  additionalParams={`serviceId=${id}`}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      {columns && dataRows ? (
        <CustomReactTable
          height={'calc(100vh - 345px)'}
          columns={columns}
          data={dataRows}
          setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
          onSelect={setSelectedRecords}
          childrenProperty="subRows"
          uniqueKey="_id"
          onSaveEdit={onSaveInlineEdit}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          hideExpander={true}
        />
      ) : (
        <Box p={2} height={500} bgcolor="white">
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
          productsDialogOpen={openAssignProductDialog}
          productId={id}
          handleCloseDialog={() => setOpenAssignProductDialog(false)}
          assignedProducts={[...parts?.map((p) => p.product), id]}
          reference={'serviceMaster'}
          renderedFrom={`${renderedFrom}_grid-sub-1`}
          onSuccess={() => {
            fetchData();
            setOpenAssignProductDialog(false);
          }}
          serialized={false}
        />
      )}
    </div>
  );
}

export default Product;
