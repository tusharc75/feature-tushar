import { Box, MenuItem } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { GrDrag } from 'react-icons/gr';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { packages, sidebarResource, prepareDataForGrid } from 'src/constants/helpers';

const Products = ({ packageId, packageData, allowedToEdit, fullHeight = false }) => {
  const renderedFrom = `${camelCase(sidebarResource?.packages)}_product`;

  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, user, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState({ open: false, data: null });
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [arrangeView, setArrangeView] = useState(false);
  const [isArranging, setIsArranging] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let api = `${packages.api}/${packageId}/products`;
    if (tabValue === 1) {
      api += `?type=${sidebarResource.assemblyOrder}`;
    } else if (tabValue === 2) {
      api += `?type=${sidebarResource.disassemblyOrder}`;
    }
    axiosInstance()
      .get(api).then(({ data: { data } }) => {
        let rows = data?.map((u, index) => {
          let res: any = {
            ...prepareDataForGrid(u, user)
          };
          res.index = index + 1;
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

  const fetchColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.product}&view=true`);
    data = response?.data?.data;
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        editable: allowedToEdit,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        disabled: true,
        Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
      }
    ];
    const newColumns = generateColumns(renderedFrom, data, routes.productDetail.path, false);
    setColumns([...coloum, ...newColumns]);
  };

  const onSaveInlineEdit = (data, row) => {
    axiosInstance()
      .put(`${packages.api}/${packageId}/products`, {
        ids: [row._id],
        qty: Number(data.qty),
        type: tabValue === 1 ? sidebarResource.assemblyOrder : tabValue === 2 ? sidebarResource.disassemblyOrder : ''
      })
      .then(({ data }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((err) => setToastConfig(err));
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const productIds = showProductConfirmBox?.data?.map((d) => d._id) || [];
    axiosInstance()
      .put(`${packages.api}/${packageId}/products/remove`, { ids: productIds, type: tabValue === 1 ? sidebarResource.assemblyOrder : tabValue === 2 ? sidebarResource.disassemblyOrder : '' })
      .then(({ data }) => {
        setRemovingProducts(false);
        setShowProductConfirmBox({ open: false, data: null });
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox({ open: false, data: null });
        setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        products: rows.map((d: any) => ({ product: d.id, qty: Number(d.qty) })),
        type: tabValue === 1 ? sidebarResource.assemblyOrder : tabValue === 2 ? sidebarResource.disassemblyOrder : ''
      })
      .then(({ data }) => {
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setShowProductAssignDialog(false);
        setSubmitting(false);
      })
      .catch((err) => {
        setToastConfig(err);
        setSubmitting(false);
      });
  };

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setShowProductAssignDialog(true)}>Add Existing Products</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.length === 0 || isRemovingProducts}
          onClick={() => {
            setShowProductConfirmBox({ open: true, data: selectedRecords });
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const handleArrangeUpdate = (rows: any) => {
    setIsArranging(true);
    rows?.forEach((e: any) => {
      delete e.preWork;
      delete e.name;
    });
    axiosInstance()
      .put(`${packages.api}/material/${packageId}/order`, {
        packageType: 'Product',
        data: rows || [],
        type: tabValue === 1 ? sidebarResource.assemblyOrder : tabValue === 2 ? sidebarResource.disassemblyOrder : ''
      })
      .then(() => {
        fetchData();
        setIsArranging(false);
        setArrangeView(false);
      })
      .catch((err) => {
        setIsArranging(false);
        setArrangeView(false);
        setToastConfig(err);
      });
  };

  const rightSideContents = () => {
    return (
      allowedToEdit && (
        <>
          <ImportExportMenu
            permissions={permissions?.packages}
            module="products"
            api={`${packages.api}/${packageId}/products`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}${tabValue === 1 ? `&type=${sidebarResource.assemblyOrder}` : tabValue === 2 ? `&type=${sidebarResource.disassemblyOrder}` : ''}`}
          />
          {dataRows?.length > 0 ? (
            <ThemeButton
              startIcon={<GrDrag fontSize="small" />}
              onClick={() => setArrangeView(true)}>
              Arrange
            </ThemeButton>
          ) : null}
        </>
      )
    );
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {(permissions?.assemblyOrder?.isRead || permissions?.disassemblyOrder?.isRead) && (
        <>
          <CustomTabs value={tabValue} onChange={handleMainTabChange} tabVariant="underlined">
            <CustomTab value={0} label={`Individual`} />
            {permissions?.assemblyOrder?.isRead && <CustomTab value={1} label={`Assembly`} />}
            {permissions?.disassemblyOrder?.isRead && <CustomTab value={2} label={`Disassembly`} />}
          </CustomTabs>
        </>
      )}
      <DetailsPageHeader
        isAddButtonVisible={allowedToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowedToEdit}
        actionButtonMenuItems={actionButtonMenuItems()}
        actionButtonProps={{ disabled: !Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length) }}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <CustomReactTable
          height={fullHeight ? 'calc(100vh - 250px)' : 'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          onSaveEdit={onSaveInlineEdit}
          hideAction={!allowedToEdit}
          hideSelection={!allowedToEdit}
          hideExportTable={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          serialized={packageData?.packageType === 'Service' ? false : null}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {showProductConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setShowProductConfirmBox({ open: false, data: null });
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
      {arrangeView && (
        <ArrangeView
          data={
            dataRows?.map((d) => {
              return { _id: d?._id, name: d?.productName, order: d?.order };
            }) || []
          }
          title={'Arrange'}
          handleClose={() => setArrangeView(false)}
          handleSubmit={handleArrangeUpdate}
          loading={isArranging}
        />
      )}
    </>
  );
};

export default Products;
