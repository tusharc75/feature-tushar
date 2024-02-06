import { useContext, useEffect, useState } from 'react';
import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { prepareDataForGrid, packages } from 'src/constants/helpers';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase } from 'lodash';
import { GrDrag } from 'react-icons/gr';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const ServiceTable = ({ packageId, packageData }) => {
  const renderedFrom = `${camelCase(routes?.serviceMaster.title)}_${packageData?.packageType || 'product'}`;
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showServiceConfirmBox, setShowServiceConfirmBox] = useState(false);
  const [showServiceAssignDialog, setShowServiceAssignDialog] = useState(false);
  const [isRemovingServices, setRemovingServices] = useState(false);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer();
  const [arrangeView, setArrangeView] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const { dataRows, selectedRecords } = state;

  useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${packages.api}/${packageId}/services`)
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let res = {
            ...prepareDataForGrid(u, user),
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
        toastConfig.setToastConfig(err);
      });
  };

  const defaultColumns = [{
    accessor: 'order',
    Header: 'Sequence',
    show: true,
    filter: false,
    sortable: false,
    Cell: ({ row }) => (row.original?.order ? <div>{row?.original?.order}</div> : <NoDataCell />)
  }];

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=Service Master`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.serviceMasterDetail.path, true);
    setColumns([...defaultColumns, ...newColumns, ActionsRenderer]);
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

  const handleUpdateQuantity = (data, row) => {
    axiosInstance()
      .put(`${packages.api}/${packageId}/services`, {
        ids: [row?._id],
        qty: Number(data?.qty)
      })
      .then(() => {
        fetchData();
      })
      .catch((err) => toastConfig.setToastConfig(err));
  };

  const removeProducts = () => {
    setRemovingServices(true);
    const Ids = selectedRecords.map((d) => d._id);
    axiosInstance()
      .put(`${packages.api}/${packageId}/services/remove`, { ids: Ids })
      .then(() => {
        setRemovingServices(false);
        setShowServiceConfirmBox(false);
        fetchData();
      })
      .catch((err) => {
        setRemovingServices(false);
        setShowServiceConfirmBox(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleArrangeUpdate = (rows: any) => {
    setIsAssigning(true);
    rows?.forEach((e: any) => {
      delete e.preWork;
      delete e.name;
    });
    axiosInstance()
      .put(`${packages.api}/${packageId}/services/order`, {
        packageType: packageData?.packageType,
        data: rows || []
      })
      .then(() => {
        fetchData();
        setIsAssigning(false);
        setArrangeView(false);
      })
      .catch((err) => {
        setIsAssigning(false);
        setArrangeView(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleClick = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorActionEl(null);
  };

  const handleAdd = async (rows) => {
    setIsAssigning(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        services: rows.map((d: any) => ({ service: d.id, qty: Number(d.qty) }))
      })
      .then(({ data }) => {
        setShowServiceAssignDialog(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setIsAssigning(false);
      })
      .catch((err) => {
        setShowServiceAssignDialog(false);
        setIsAssigning(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Box>
      <Box mb={1} mt={1} display="flex" justifyContent="space-between">
        <Box display="flex">
          {permissions?.packages?.isUpdate && (
            <Button variant="contained" color="primary" size="small" onClick={() => setShowServiceAssignDialog(true)}>
              {`Add Services`}
            </Button>
          )}
        </Box>
        <Box display="flex" style={{ marginLeft: 'auto' }}>
          {permissions?.packages?.isUpdate && (
            <Box ml={1} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" color="primary" size="small" onClick={() => setArrangeView(true)}>
                <GrDrag fontSize="small" color="primary" className="mr-1" />
                Arrange
              </Button>
              <Box ml={1} />
              <Button
                variant={'outlined'}
                color="primary"
                aria-controls="simple-menu"
                aria-haspopup="true"
                disabled={selectedRecords.length === 0 || isRemovingServices}
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
                  disabled={selectedRecords.length === 0 || isRemovingServices}
                  onClick={() => {
                    setShowServiceConfirmBox(true);
                    handleClose();
                  }}
                >
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          )}
          <Box ml={1} />
          <ImportExportMenu
            permissions={permissions?.packages}
            module="services"
            api={`${packages.api}/${packageId}/services`}
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
      {showServiceAssignDialog && (
        <AssignServiceDialog
          handleClose={() => setShowServiceAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isAssigning}
        />
      )}
      {showServiceConfirmBox && (
        <ConfirmationDialog
          open={showServiceConfirmBox}
          message={`Are you sure you want to delete the service(s) ?`}
          onClose={() => {
            setShowServiceConfirmBox(false);
          }}
          okBtnLoading={isRemovingServices}
          onOk={removeProducts}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            dataRows?.map((d) => {
              return { _id: d?._id, name: d?.serviceName || d?.productName, order: d?.order, preWork: d?.preWork };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isAssigning}
        />
      )}
    </Box>
  );
};

export default ServiceTable;
