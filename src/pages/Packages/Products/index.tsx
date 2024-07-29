import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import { packages, sidebarResource, prepareDataForGrid } from 'src/constants/helpers';

const Products = ({ packageId, packageData, allowedToEdit = true, fullHeight = false }) => {

  const renderedFrom = `${camelCase(routes?.packages.title)}_product`;

  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState({ open: false, data: null });
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);

  const [allowToEdit] = useState((permissions?.packages?.isCreate || permissions?.packages?.isUpdate) && allowedToEdit);

  const [isSubmitting, setSubmitting] = useState(false);
  const { state, dispatch } = useTableReducer();
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${packages.api}/${packageId}/products`)
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
        setToastConfig(err);
      });
  };

  const ActionsRenderer = {
    accessor: 'qty',
    Header: 'Qty',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    editable: permissions?.product?.isUpdate && allowedToEdit,
    cellEditor: 'numericCellEditor',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
  };

  const fetchColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.product}`);
    data = response?.data?.data;
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
    ];
    const newColumns = generateColumns(renderedFrom, data);
    setColumns([...coloum, ...newColumns, ActionsRenderer]);
  };

  const onSaveInlineEdit = (inputField, updatedData) => {
    handleUpdateQuantity(updatedData);
  };

  const handleUpdateQuantity = (row) => {
    if (row.type === 'product') {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products`, {
          ids: [row._id],
          qty: Number(row.qty)
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
    }
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const allRecords = [...showProductConfirmBox?.data];
    selectedRecords?.forEach((record) => {
      for (let i = 0; i < (record?.subRows || [])?.length; i++) {
        allRecords.push(record.subRows[i]);
      }
    });
    const productIds = allRecords?.filter((d) => d.type === 'product')?.map((d) => d._id) || [];
    const assetIds = allRecords?.filter((d) => d.type === 'asset')?.map((d) => d.id) || [];
    if (productIds?.length) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/remove`, { ids: productIds })
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
    }
    if (assetIds?.length) {
      axiosInstance()
        .put(`${packages.api}/${packageId}/products/asset/remove`, { ids: assetIds })
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
    }
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        products: rows.map((d: any) => ({ product: d.id, qty: Number(d.qty) }))
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
        <MenuItem onClick={() => setShowProductAssignDialog(true)}>Add Products</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={permissions?.packages?.isUpdate && (selectedRecords.length === 0 || isRemovingProducts)}
          onClick={() => {
            setShowProductConfirmBox({ open: true, data: selectedRecords });
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  const rightSideContents = () => {
    return (
      <>
        {allowToEdit && (
          <ImportExportMenu
            permissions={permissions?.packages}
            module="products"
            api={`${packages.api}/${packageId}/products`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            ids={[]}
            additionalParams={`refrenceId=${packageId}`}
          />
        )}
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={allowToEdit}
        addButtonMenuItems={addButtonMenuItems()}
        isActionButtonVisible={allowToEdit}
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
          hideAction={allowToEdit ? false : true}
          hideSelection={allowToEdit ? false : true}
          hideExportTable={!allowedToEdit}
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
    </>
  );
};

export default Products;