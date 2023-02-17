import React from 'react';
import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { serviceOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { BiChevronDown } from 'react-icons/bi';
import { startCase } from 'lodash';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { fetch_service_order_detail_fields } from 'src/components/ServiceOrder/helper';
import { genrateCustomTableColumns } from 'src/constants/columns';

const Products = ({ serviceOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit }: any) => {

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [selectedProducts, setSelectedProducts] = useState([]);

  const [addProductDialog, setAddProductDialog] = useState({ open: false, parentId: null });
  const [isAddingProducts, setAddingProducts] = useState(false);

  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);

  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    var allFields = await fetch_service_order_detail_fields(serviceOrderData?.currency);
    allFields?.forEach((e) => {
      e.isColumnEditable = false;
    });
    const newColumns = genrateCustomTableColumns(allFields, serviceOrderData?.currency, renderedFrom);
    let qtyIndex = newColumns.findIndex(d => d.accessor === 'qty')
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay'
    }
    let column: any = [
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>
              {`${startCase(row.original?.type)} `}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: ' Details',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p className="text-truncate" title={row.original.detail}  >
              {row.original.detail}
            </p>
            <IconButton
              size="small"
              style={{ marginLeft: "10px" }}
              onClick={() => {
                if (row.original.type === 'service') {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                }
                else if (row.original.type === 'product') {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else {
                  window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <OpenInNewIcon fontSize="small" color="primary" />
            </IconButton>
          </div>
        )
      }
    ];
    column = [...column, ...newColumns];
    column.push({
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return allowedToEdit && row.original.type === 'product' ? (
          <HtmlTooltip title={'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  getNestedSubRows(obj, row.original);
                  setDeleteData(obj);
                }}
              >
                <DeleteIcon fontSize="small" color={'error'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        ) : null;
      }
    });
    setColumns(column);
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];

    const response = await axiosInstance().get(`${serviceOrder.api}/${serviceOrderData._id}/material`);
    data = response?.data?.data;

    let rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail =
        parent.type === 'product'
          ? parent?.productDetail?.productName
          : parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent?.packageDetail?.packageName;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : '';
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });

    if (rows?.length > 0) {
      setNextStep(true);
    }

    setRowsData(rows);
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.srno = parent.srno + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'product'
          ? _subRow?.productDetail?.productName
          : _subRow.type === 'service'
            ? _subRow?.serviceDetail?.serviceName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty} `;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleAdd = (rows) => {
    setAddingProducts(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = 'product';
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addProductDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${serviceOrder.api}/${serviceOrderData._id}/material`, { material: material })
      .then(({ data }) => {
        setAddingProducts(false);
        setAddProductDialog({ open: false, parentId: null });
        fetchData();
      })
      .catch((error) => {
        setAddingProducts(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${serviceOrder.api}/${serviceOrderData?._id}/material/delete `, { ids: rows.map(d => d.id) })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteMultiple = () => {
    const obj: any = [];
    const dataToDelete = selectedProducts.filter((e) => e.type === "product");
    dataToDelete?.forEach((ele) => {
      obj.push({ id: ele._id, type: ele.type, materialId: ele.materialId });
    });
    dataToDelete?.forEach((ele) => {
      getNestedSubRows(obj, ele);
    });
    setDeleteData(obj);
  };

  return (
    <Fragment>
      <Grid container spacing={2}>
        {allowedToEdit && (
          <Grid item xs={12} md={12} sm={12}>
            <Box display="flex" justifyContent="space-between" m={1} mb={0}>
              <Box display="flex">
              </Box>
              <Box display="flex">
                <Button
                  variant={'outlined'}
                  color="primary"
                  size="small"
                  onClick={handleClick}
                  disabled={selectedProducts.length ? false : true}
                  endIcon={<BiChevronDown />}
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  onClose={handleClose}
                >
                  <MenuItem
                    disabled={selectedProducts?.filter((e) => e.type === "service")?.length === 1 ? false : true}
                    onClick={() => {
                      setAddProductDialog({ open: true, parentId: selectedProducts?.filter((e) => e.type === "service")[0]?._id });
                      handleClose();
                    }}
                  >
                    Add Product
                  </MenuItem>
                  <MenuItem
                    disabled={selectedProducts?.filter((e) => e.type === "product")?.length > 0 ? false : true}
                    onClick={() => {
                      handleDeleteMultiple();
                      handleClose();
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
          </Grid>
        )}
        <Grid item xs={12} md={12} sm={12}>
          {columns && rowsData ? (
            <Box zIndex={5} width={'100%'} height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}  >
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 393px)'}
                columns={columns}
                data={rowsData}
                onSelect={setSelectedProducts}
                childrenProperty="subRows"
                uniqueKey="_id"
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
      {addProductDialog.open && (
        <AssignProductDialog
          reference="serviceOrder"
          serialized={null}
          productsDialogOpen={addProductDialog.open}
          productId={null}
          handleCloseDialog={() => setAddProductDialog({ open: false, parentId: null })}
          assignedProducts={[]}
          renderedFrom={renderedFrom}
          onSuccess={(row) => {
            handleAdd(row);
          }}
        />
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
    </Fragment>
  );
};

export default Products;
