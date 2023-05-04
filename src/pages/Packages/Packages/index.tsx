import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import CustomAgGrid from 'src/components/AgGridComponents/CustomAgGridEditable';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { reducer, intialState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages } from 'src/constants/helpers';
import useColumns, { getFrameworkComponents } from 'src/constants/useColumns';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import Loader from 'src/components/Loader';
import { camelCase } from 'lodash';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';

const PackagesTable = ({ packageId, packageData }) => {
  const renderedFrom = `${camelCase(routes?.packages.title)}_${packageData?.packageType || 'product'}`;

  const { setToastConfig } = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();

  const [columns, setColumns] = useState([]);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [showServiceAssignDialog, setShowServiceAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { getColumnData } = useColumns();
  const [state, dispatch] = useReducer(reducer, intialState);
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${packages.api}/${packageId}/package`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u),
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

  // needed in future
  //   const defaultColumns = [{ field: 'order', headerName: 'Order', show: true, cellRenderer: 'commonRenderer' }];

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=Packages`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(routes.packages.title, o?.fieldData, routes.packagesDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent
        };
        setFrameWorkComponent({
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        });
        setColumns([...columns]);
      });
  };

  const handleUpdateQuantity = (row) => {
    axiosInstance()
      .put(`${packages.api}/${packageId}/package`, {
        ids: [row.data._id],
        qty: Number(row.data.qty)
      })
      .then(() => {
        fetchData();
      })
      .catch((err) => setToastConfig(err));
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

  const ActionsRenderer = (params) => <span>{params?.data?.qty}</span>;

  const handleAssignPackage = (rows) => {
    axiosInstance()
      .post(`${packages.api}/${packageId}/package`, {
        ids: [packageId],
        packages: rows?.map((d: any) => ({ packageId: d?._id, qty: d?.qty ? Number(d?.qty) : Number(1) }))
      })
      .then(() => {
        setShowProductAssignDialog(false);
        setShowServiceAssignDialog(false);
        fetchData();
      })
      .catch((err) => {
        setShowProductAssignDialog(false);
        setShowServiceAssignDialog(false);
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
      {isMobile && !isTablet ? (
        <CustomSwipableList
          allowSelection={permissions?.packages?.isUpdate}
          allowSwipe={permissions?.packages?.isUpdate}
          permissions={permissions?.packages}
          primaryField={columns?.find((d) => d.primaryField)}
          onClick={(data) => {
            history.push(`${routes.productDetail.path}/${data._id}`);
          }}
          dataRows={dataRows}
          selectedRecords={[]}
          dispatch={dispatch}
          onEdit={(data) => { }}
          extraParamsToCheckDelete={true}
          onDelete={(data) => { }}
          rowCount={rowCount}
          page={page}
          loading={loading}
          additionalDetails={[]}
          chips={[
            {
              label: 'Quantity : ',
              field: 'qty'
            }
          ]}
          owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
          onCreate={() => {
            setShowProductAssignDialog(true);
          }}
          showClone={true}
          onClone={(data) => { }}
          renderedFrom={renderedFrom}
        />
      ) : Object.keys(frameWorkComponent).length > 0 ? (
        <CustomAgGrid
          columns={columns}
          dataRows={dataRows}
          frameworkComponents={frameWorkComponent}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          isClientSideGrid={true}
          actionWidth={150}
          loading={loading}
          allowSelection={permissions?.packages?.isUpdate}
          actionLabel="Qty"
          renderedFrom={renderedFrom}
          actionEditable={permissions?.packages?.isUpdate}
          onCellValueChanged={handleUpdateQuantity}
          refreshGrid={fetchData}
        />
      ) : (
        <Loader noLoader={false} minHeight={'400px'} text="Loading..." />
      )}
      {showProductAssignDialog && (
        <AssignPackageDialog
          referenceType="packages"
          handleClose={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Product'}
        />
      )}
      {showServiceAssignDialog && (
        <AssignPackageDialog
          referenceType="packages"
          handleClose={() => setShowServiceAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id), packageId]}
          onSuccess={(rows) => {
            handleAssignPackage(rows);
          }}
          packageType={'Service'}
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
