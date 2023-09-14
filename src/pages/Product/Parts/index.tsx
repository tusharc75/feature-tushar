import { useState, useEffect, useContext, Fragment } from 'react';
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
import { generateCustomTableColumns } from 'src/constants/columns';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

function Parts({ id }) {

  const renderedFrom = `${camelCase(routes?.product.title)}_bom`;
  const {
    state: { permissions, user, selectedEntity }
  }: any = useData();

  const hasPermissions = permissions && permissions[product.permission]?.isUpdate;
  const { setToastConfig } = useContext(CustomToastContext);

  const [parts, setParts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, data: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openAssignProductDialog, setOpenAssignProductDialog] = useState(false);
  const [columns, setColumns] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [rowsData, setRowsData] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchBOMData = async () => {
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
    setRowsData(rows);
    setSelectedRecords([]);
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
    const newColumns = generateCustomTableColumns(fields?.filter((e) => ['productDescription', 'productNumber', 'productCategory', 'productCategory']?.includes(e?.fieldName))
      , 'USD', renderedFrom);

    coloum = [...coloum, ...newColumns, {
      accessor: 'qty',
      Header: 'Qty',
      width: 150,
    }];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
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
                permissions={permissions?.packages}
                module="packages-products"
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
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            columns={columns}
            height={'calc(100vh - 345px)'}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
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
          assignedProducts={[...parts?.map((p) => p.childProduct), id]}
          onSuccess={() => {
            if (permissions?.serializedAsset) {
              fetchBOMData();
            }
            setOpenAssignProductDialog(false);
          }}
        />
      )}
    </div>
  );
}

export default Parts;
