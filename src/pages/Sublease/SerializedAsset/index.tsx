import { Box, Button, Grid, IconButton, MenuItem } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { startCase, uniqBy } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { flattenArray } from 'src/constants/columns';
import {
  ASSET_STATUS,
  CHILD_RESOURCE,
  DELIVERY_TICKET_REFERENCE_TYPE,
  DELIVERY_TICKET_TYPE,
  MATERIAL_TYPE,
  deliveryTicket,
  sublease,
  treeToFlatArray
} from 'src/constants/helpers';
import { subleaseMessage } from 'src/constants/messageHelpers';

function SerializedAsset({ subleaseData, setNextStep, setNextStepToolTip, allowedToEdit, stepFullScreen, renderedFrom }) {
  const toastConfig = useContext(CustomToastContext);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;

  const {
    state: { resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);
  const [assetAssignedProduct, setAssetAssignedProduct] = useState([]);
  const [isAdding, setAdding] = useState(false);
  const [deleteData, setDeleteData] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setNextStep(false);
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.subleaseProduct, subleaseData?.currency, false);
    const newColumns = generateColumns(renderedFrom, data, null, false, subleaseData?.currency);
    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile || isTablet ? 'none' : 'left',
        width: 100,
        Cell: ({ row }) =>
          row.original['type'] ? (
            <p>{row.original?.type === 'asset' && row.original?.isNonSerializeAsset ? 'Inventory' : `${startCase(row.original?.type)} `}</p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 200,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row.original.detail}>
              {row.original.detail}
            </p>
            {
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === 'asset') {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.inventory}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            }
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'assets',
        Header: 'Asset Assigned',
        disableFilters: true,
        disableSortBy: true,
        Cell: ({ row }) => getAssetAssignedValues(row)
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <div>
            {row.original?.type === 'asset' && (
              <span className="d-flex align-items-center gap-2">
                {allowedToEdit && (
                  <HtmlTooltip title={`Remove`}>
                    <IconButton
                      size="small"
                      disabled={!row?.original?.canDelete}
                      onClick={() => {
                        setShowConfirmBox(true);
                        setDeleteData([row.original.inventory]);
                      }}
                    >
                      <Delete fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
                    </IconButton>
                  </HtmlTooltip>
                )}
              </span>
            )}
          </div>
        );
      }
    });
    setColumns(coloum);
    fetchRowData();
  };

  const getAssetAssignedValues = (row) => {
    if (row?.original?.type === 'asset' || row?.original?.assetQty === 0) {
      return <div>N/A</div>;
    }
    return (
      <div>
        {row?.original?.assetAssignedQty} / {row?.original?.assetQty}
      </div>
    );
  };

  const fetchRowData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    setNextStep(false);
    setNextStepToolTip(null);
    try {
      var data: any = [];

      const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);
      data = response?.data?.data;

      const {
        data: { data: loadingTicket }
      } = await axiosInstance().get(
        `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.sublease}&referenceId=${subleaseData._id}&ticketType=${DELIVERY_TICKET_TYPE.loading}`
      );
      var loadingTicketAssets = [];
      loadingTicket?.forEach((element) => {
        loadingTicketAssets = [...loadingTicketAssets, ...element?.assets?.map((e) => e.asset)];
      });
      let rows = data.material.filter((e) => !e.parentId);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail = `${
          parent.type === 'service'
            ? parent?.serviceDetail?.serviceName
            : parent.type === 'product'
              ? parent?.productDetail?.productName
              : parent?.packageDetail?.packageName
        }`;
        parent.description =
          parent.type === 'service'
            ? parent?.serviceDetail?.serviceDescription || ''
            : parent.type === 'product'
              ? parent?.productDetail?.productDescription || ''
              : parent.type === 'package'
                ? parent?.packageDetail?.packageDescription || ''
                : '';
        parent.serializedProduct = parent.type === 'product' ? parent?.productDetail?.serializedProduct : false;
        parent.assetQty = parent.qty;
        parent.assetAssignedQty = parent.serializedProduct ? data.inventory?.filter((e) => e._id === parent._id).length : 0;
        parent.realAssetQty = parent.assetQty;
        parent.realAssetAssignedQty = parent.assetAssignedQty;
        parent.subRows = generateNestedData(data.material, data.inventory, parent, loadingTicketAssets);
        parent.assetQty =
          parent.subRows.filter((d) => d.type !== 'asset').length === 0
            ? parent.assetQty
            : parent.subRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetQty + sum, 0) +
              (parent.type === 'product' ? parent.assetQty : 0);
        parent.assetAssignedQty =
          parent.subRows.filter((d) => d.type !== 'asset').length === 0
            ? parent.assetAssignedQty
            : parent.subRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetAssignedQty + sum, 0) +
              (parent.type === 'product' ? parent?.subRows.filter((d) => d.type === 'asset')?.length : 0);
        parent.isValid = parent.serializedProduct
          ? parent.assetAssignedQty === parent.assetQty
            ? true
            : false
          : parent.subRows.length !== 0
            ? parent.assetAssignedQty ===
                parent.subRows.filter((d) => d.type !== 'asset' && d.serializedProduct).reduce((sum, row) => row.assetQty + sum, 0) ||
              parent.subRows.every((d) => d.isValid)
            : true;
        if (parent.subRows.length && parent.isValid) {
          if (parent.subRows.every((d) => d.isValid)) {
            parent.isValid = true;
          } else {
            parent.isValid = false;
          }
        }
      });

      if (rows.every((d) => d.isValid)) {
        setNextStep(true);
        setNextStepToolTip(null);
      } else {
        setNextStep(false);
        setNextStepToolTip(subleaseMessage.assignAssets);
      }
      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const generateNestedData = (material, inventory, parent, loadingTicketAssets) => {
    const subRows: any = [];
    const inventory_result = inventory?.filter((e) => e._id === parent._id);
    inventory_result?.forEach((_inventory, k) => {
      subRows.push({
        ..._inventory,
        index: `${parent.index}.${k + 1}`,
        detail: _inventory?.assetNumber ? _inventory?.assetNumber : _inventory.inventoryDetail?.assetNumber,
        description: parent?.description,
        type: 'asset',
        isNonSerializeAsset: false,
        status: _inventory.inventoryDetail?.status,
        rentalAssetStatus: _inventory?.status,
        manualStatus: _inventory.inventoryDetail?.manualStatus,
        warehouse: _inventory.inventoryDetail?.warehouse,
        _id: _inventory.inventory,
        isValid: _inventory.inventoryDetail?.manualStatus === ASSET_STATUS.reserved ? false : true,
        canDelete: loadingTicketAssets?.find((e) => e === _inventory.inventory) ? false : true
      });
    });

    const childProduct: any = material.filter((e) => e.parentId === parent._id);
    var assetAssignedQtySUM = 0;
    childProduct.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceName
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productName
            : _subRow?.packageDetail?.packageName;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.serializedProduct = _subRow.type === 'product' ? _subRow?.productDetail?.serializedProduct : false;
      _subRow.assetQty =
        _subRow.type === 'product' || _subRow.type === 'package'
          ? parent.type === 'product' || parent.type === 'package'
            ? _subRow.qty * parent.assetQty
            : _subRow.qty * parent.qty
          : 0;
      _subRow.assetAssignedQty = _subRow.serializedProduct ? inventory?.filter((e) => e._id === _subRow._id).length : 0;
      _subRow.realAssetQty = _subRow.type === 'product' || _subRow.type === 'package' ? _subRow.qty * parent.realAssetQty : 0;
      _subRow.realAssetAssignedQty = _subRow.assetAssignedQty;
      let tempSubRows = generateNestedData(material, inventory, _subRow, loadingTicketAssets);
      _subRow.subRows = tempSubRows;
      _subRow.assetQty =
        tempSubRows.filter((d) => d.type !== 'asset').length === 0
          ? _subRow.assetQty
          : tempSubRows.filter((d) => d.type !== 'asset').reduce((sum, row) => row.assetQty + sum, 0) +
            (_subRow.type === 'product' ? _subRow.assetQty : 0);
      _subRow.isValid = _subRow.serializedProduct
        ? _subRow.assetAssignedQty === _subRow.assetQty
          ? true
          : false
        : tempSubRows?.filter((e) => e.type === 'asset')?.length === tempSubRows?.length
          ? true
          : _subRow.assetAssignedQty ===
              tempSubRows.filter((d) => d.type !== 'asset' && d.serializedProduct).reduce((sum, row) => row.assetQty + sum, 0)
            ? true
            : false;
      subRows.push(_subRow);
      assetAssignedQtySUM += _subRow.serializedProduct ? _subRow.assetAssignedQty : 0;
    });

    parent.assetAssignedQty += assetAssignedQtySUM;
    parent.isValid = parent.serializedProduct || parent.type === 'package' ? (parent.assetAssignedQty === parent.assetQty ? true : false) : true;

    return subRows;
  };

  const handleAssignAssets = (assets) => {
    var data = [];
    assets.forEach((e) => {
      data.push({ _id: e?._id, inventory: e.asset });
    });
    if (data.length) {
      setAdding(true);
      axiosInstance()
        .post(`${sublease.api}/asset/${subleaseData._id}`, { assets: data })
        .then(({ data }) => {
          setAddSerializedAssetDialog(false);
          fetchRowData();
          dispatch({ type: 'selection', selectedRecords: [] });
          setAssetAssignedProduct([]);
          setAdding(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
        })
        .catch((error) => {
          setAdding(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = treeToFlatArray(selectedRecords, 'subRows').filter(
      (f) => f.type === 'product' && f.serializedProduct && f.realAssetQty > f.realAssetAssignedQty
    );
    return flatArray.length === 0;
  };

  const handleRemoveAsset = () => {
    axiosInstance()
      .put(`${sublease.api}/asset/${subleaseData._id}/remove`, { ids: deleteData })
      .then(() => {
        setDeleting(false);
        fetchRowData();
        setDeleteData(null);
        setShowConfirmBox(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={
            selectedRecords?.length &&
            selectedRecords?.filter((e) => e.type === 'asset' && e.canDelete)?.length === selectedRecords?.filter((e) => e.type === 'asset')?.length
              ? false
              : true
          }
          onClick={() => {
            const inventories = uniqBy(flattenArray(selectedRecords), '_id')
              ?.filter((e) => e.type === 'asset')
              ?.map((e) => e.inventory);
            setShowConfirmBox(true);
            setDeleteData(inventories);
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
        <Button
          variant="contained"
          color="primary"
          type="button"
          size="small"
          disabled={disableAssignSerializedAssets()}
          onClick={() => {
            setAssetAssignedProduct(selectedRecords.filter((i) => i?.type === 'product' && i?.productDetail?.serializedProduct));
            setAddSerializedAssetDialog(true);
          }}
        >
          {`Assign ${resources?.serializedAsset?.titleSingular}`}
        </Button>
      </>
    );
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <>
          <DetailsPageHeader
            isAddButtonVisible={false}
            actionButtonMenuItems={actionButtonMenuItems()}
            isActionButtonVisible={true}
            actionButtonProps={{ disabled: uniqBy(flattenArray(selectedRecords), '_id')?.filter((e) => e.type === 'asset')?.length === 0 }}
            rightSideContents={rightSideContents()}
          />
        </>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={12} sm={12}>
          {columns ? (
            <Box zIndex={5}>
              <CustomReactTable
                height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchRowData}
                setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
                hideSelection={!allowedToEdit}
                hideAction={!allowedToEdit}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
                expander={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>

      {addSerializedAssetDialog && (
        <AssignSerializedAssetDialog
          reference={'sublease'}
          handleClose={() => {
            setAddSerializedAssetDialog(false);
            setAssetAssignedProduct([]);
          }}
          ids={flattenArray(dataRows)
            ?.filter((e) => e.type === 'serializedAsset')
            ?.map((e) => e.materialId)}
          handleSucess={(rows) => {
            handleAssignAssets(rows);
          }}
          referenceData={{
            warehouse: subleaseData?.fromWarehouse?.optionValue,
            _id: subleaseData?._id
          }}
          isAssigning={isAdding}
          selectedProducts={assetAssignedProduct?.map((i) => {
            return { _id: i._id, product: i.materialId, productName: i.detail, qty: i.assetQty - i.assetAssignedQty };
          })}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to remove?`}
          onClose={() => {
            setShowConfirmBox(false);
            setDeleteData([]);
          }}
          okBtnLoading={deleting}
          onOk={handleRemoveAsset}
        />
      )}
    </Fragment>
  );
}

export default SerializedAsset;
