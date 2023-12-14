import { useContext, useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages } from 'src/constants/helpers';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';

const PackagesTable = ({ packageId, packageData }) => {
  const renderedFrom = `${camelCase(routes?.packages.title)}_${packageData?.packageType || 'product'}`;

  const { setToastConfig } = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState([]);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [showServiceAssignDialog, setShowServiceAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const { dataRows, selectedRecords } = state;

  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${packages.api}/${packageId}/package`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u,user),
            inventoryCount: u?.qty,
            warehouses: u.warehouse?.map((w) => w.warehouseName).join(', '),
            productCategoryChipColor: u.productCategory?.chipColour
          };
          for (let col in res) {
            if (res[col] && res[col].optionLabel) {
              res[col] = res[col].optionLabel;
            }
          }
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: data.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        setToastConfig(err);
      });
  };

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Packages`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.packagesDetail.path, true);
    setColumns([...newColumns, ActionsRenderer]);
  };

  const handleUpdateQuantity = (data, row) => {
    if (Number(row?.qty) > 0) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/package`, {
          ids: [row?._id],
          qty: Number(data?.qty)
        })
        .then(() => {
          fetchData();
        })
        .catch((err) => setToastConfig(err));
    } else {
      fetchData();
    }
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const Ids = selectedRecords.map((d) => d._id);
    axiosInstance()
      .put(`${packages.api}/${packageId}/package/remove`, { ids: Ids })
      .then(() => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        fetchData();
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setToastConfig(err);
      });
  };

  const ActionsRenderer = {
    accessor: 'qty',
    Header: 'Qty',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    editable: permissions?.packages?.isUpdate,
    cellEditor: 'numericCellEditor',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
  };

  const handleAssignPackage = (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/${packageId}/package`, {
        ids: [packageId],
        packages: rows?.map((d: any) => ({ packageId: d?._id, qty: d?.qty ? Number(d?.qty) : Number(1) }))
      })
      .then(() => {
        setShowProductAssignDialog(false);
        setShowServiceAssignDialog(false);
        fetchData();
        setSubmitting(false);
      })
      .catch((err) => {
        setSubmitting(false);
        setToastConfig(err);
      });
  };

  const handleClick = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorActionEl(null);
  };

  return (
    <Box>
      <Box mb={1} mt={1} display="flex" justifyContent="space-between">
        <Box display="flex">
          {permissions?.packages?.isUpdate && (
            <Box ml={1} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button variant="contained" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
                {`Add Product Packages`}
              </Button>
              <Box ml={1} />
              <Button variant="contained" color="primary" size="small" onClick={() => setShowServiceAssignDialog(true)}>
                {`Add Service Packages`}
              </Button>
            </Box>
          )}
        </Box>
        <Box display="flex">
          {permissions?.packages?.isUpdate && (
            <>
              <Button
                variant={'outlined'}
                color="primary"
                aria-controls="simple-menu"
                aria-haspopup="true"
                disabled={selectedRecords.length === 0 || isRemovingProducts}
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
                  disabled={selectedRecords.length === 0 || isRemovingProducts}
                  onClick={() => {
                    setShowProductConfirmBox(true);
                    handleClose();
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}

          <Box ml={1} />
          <ImportExportMenu
            permissions={permissions?.packages}
            module="packages-products"
            api={`${packages.api}/${packageId}/package`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
          />
        </Box>
      </Box>
      {columns ? (
          <CustomReactTable
            height={'calc(100vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            onSaveEdit={handleUpdateQuantity}
          />
        ) : <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>}
      {showProductAssignDialog && (
        <AssignPackageDialog
          handleClose={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Product'}
          isSubmitting={isSubmitting}
        />
      )}
      {showServiceAssignDialog && (
        <AssignPackageDialog
          handleClose={() => setShowServiceAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Service'}
          isSubmitting={isSubmitting}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={showProductConfirmBox}
          message={`Are you sure you want to delete the product(s) ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
    </Box>
  );
};

export default PackagesTable;
