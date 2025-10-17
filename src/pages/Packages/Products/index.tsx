import { Box, IconButton, MenuItem } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { GrDrag } from 'react-icons/gr';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import BulkActionContainer from 'src/components/CustomReactTable/GridHeader/ModernBulkAction/BulkActionContainer';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrangeView from 'src/components/Helpers/ArrangeView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import {
  packages,
  sidebarResource,
  prepareDataForGrid,
  WORK_ORDER_TYPE_LABEL,
  WORK_ORDER_TYPE,
  PACKAGE_TYPE,
  MATERIAL_SUB_TYPE
} from 'src/constants/helpers';
import ContainedTabs, { ContainedTab } from 'src/components/CustomTabs/ContainedTab';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import { cH } from '@fullcalendar/core/internal-common';

const Products = ({ packageId, packageData, allowedToEdit, fullHeight = false, childItem = false }) => {
  const renderedFrom = `${camelCase(sidebarResource?.packages)}_product`;

  const { setToastConfig } = useContext(CustomToastContext);

  const {
    state: { permissions, user }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [arrangeView, setArrangeView] = useState(false);
  const [isArranging, setIsArranging] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [tabValue, setTabValue] = useState(0);
  const [selectedResource, setSelectedResource] = useState(WORK_ORDER_TYPE.assemblyOrder);
  const [deleteRecord, setDeleteRecord] = useState(null);

  useEffect(() => {
    fetchColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedResource]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let api = `${packages.api}/${packageId}/products`;
    if (childItem) {
      api += `?type=${MATERIAL_SUB_TYPE.childItem}`;
    } else if (selectedResource) {
      api += `?type=${selectedResource}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
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
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.product, false);
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
        width: 150,
        editable: allowedToEdit,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        disabled: true,
        Cell: ({ row }) => (row.original?.qty ? <div>{row.original?.qty}</div> : <NoDataCell />)
      },
      {
        accessor: 'action',
        Header: 'Actions',
        width: 100,
        sticky: 'right',
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        Cell: ({ row }) => (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setDeleteRecord([row.original]);
                setShowProductConfirmBox(true);
              }}
            >
              <DeleteIcon color="error" fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )
      }
    ];
    const newColumns = generateColumns(renderedFrom, fieldsDataForRead, routes.productDetail.path, false);
    setColumns([...coloum, ...newColumns]);
  };

  const onSaveInlineEdit = (data, row) => {
    axiosInstance()
      .put(`${packages.api}/${packageId}/products`, {
        ids: [row._id],
        qty: Number(data.qty),
        type: childItem ? MATERIAL_SUB_TYPE.childItem : selectedResource
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
    let ids = deleteRecord?.map((d) => d._id);
    axiosInstance()
      .put(`${packages.api}/${packageId}/products/remove`, { ids: ids, type: childItem ? MATERIAL_SUB_TYPE.childItem : selectedResource })
      .then(({ data }) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setDeleteRecord(null);
        fetchData();
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        setToastConfig(err);
      });
  };

  const handleAdd = async (rows) => {
    setSubmitting(true);
    axiosInstance()
      .post(`${packages.api}/material`, {
        ids: [packageId],
        products: rows.map((d: any) => ({ product: d.id, qty: Number(d.qty) })),
        type: childItem ? MATERIAL_SUB_TYPE.childItem : selectedResource
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

  const handleArrangeUpdate = (rows: any) => {
    setIsArranging(true);
    rows?.forEach((e: any) => {
      delete e.preWork;
      delete e.name;
    });
    axiosInstance()
      .put(`${packages.api}/material/${packageId}/order`, {
        packageType: PACKAGE_TYPE.product,
        data: rows || [],
        type: childItem ? MATERIAL_SUB_TYPE.childItem : selectedResource
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
            additionalParams={`referenceId=${packageId}${childItem ? `&type=${MATERIAL_SUB_TYPE.childItem}` : selectedResource ? `&type=${selectedResource}` : ''}`}
          />
          {dataRows?.length > 0 ? (
            <ThemeButton startIcon={<GrDrag fontSize="small" />} onClick={() => setArrangeView(true)}>
              Arrange
            </ThemeButton>
          ) : null}
        </>
      )
    );
  };

  const handleMainTabChange = (event: any, newValue: number) => {
    setSelectedResource(
      newValue === 0
        ? WORK_ORDER_TYPE.assemblyOrder
        : newValue === 1
          ? WORK_ORDER_TYPE.preInspectionOrder
          : newValue === 2
            ? WORK_ORDER_TYPE.postInspectionOrder
            : newValue === 3
              ? WORK_ORDER_TYPE.disassemblyOrder
              : ''
    );
    setTabValue(newValue);
  };

  return (
    <>
      {!childItem && (
        <>
          <ContainedTabs value={tabValue} onChange={handleMainTabChange} className="mb-2">
            <ContainedTab value={0} label={`${WORK_ORDER_TYPE_LABEL[WORK_ORDER_TYPE.assemblyOrder]}-WO`} />
            <ContainedTab value={1} label={`${WORK_ORDER_TYPE_LABEL[WORK_ORDER_TYPE.preInspectionOrder]}-WO`} />
            <ContainedTab value={2} label={`${WORK_ORDER_TYPE_LABEL[WORK_ORDER_TYPE.postInspectionOrder]}-WO`} />
            <ContainedTab value={3} label={`${WORK_ORDER_TYPE_LABEL[WORK_ORDER_TYPE.disassemblyOrder]}-WO`} />
          </ContainedTabs>
        </>
      )}
      {allowedToEdit && (
        <DetailsPageHeader
          isAddButtonVisible={allowedToEdit}
          addButtonMenuItems={addButtonMenuItems()}
          rightSideContents={rightSideContents()}
          isActionButtonVisible={false}
          hasXpadding
        />
      )}
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
          bulkActionItems={
            <BulkActionItems
              selectedRecords={selectedRecords}
              setDeleteRecord={setDeleteRecord}
              setShowProductConfirmBox={setShowProductConfirmBox}
              allowedToEdit={allowedToEdit}
            />
          }
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          serialized={packageData?.packageType === PACKAGE_TYPE.service || !childItem ? false : null}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          ids={[...dataRows?.map((e) => e._id)]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
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

const BulkActionItems = ({ selectedRecords, setDeleteRecord, setShowProductConfirmBox, allowedToEdit }) => {
  return (
    <BulkActionContainer>
      <BulkActionContainer.Button
        disabled={!allowedToEdit}
        onClick={() => {
          setDeleteRecord(selectedRecords);
          setShowProductConfirmBox(true);
        }}
        buttonType="red"
      >
        Delete
      </BulkActionContainer.Button>
    </BulkActionContainer>
  );
};
