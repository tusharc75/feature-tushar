import { Button, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box/Box';
import { Cancel } from '@mui/icons-material';
import HistoryIcon from '@mui/icons-material/History';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { startCase } from 'lodash';
import { useContext, useEffect, useState, useRef } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, MATERIAL_TYPE, PURCHASE_ORDER_STATUS, prepareDataForGrid, purchaseOrder, sidebarResource } from 'src/constants/helpers';
import History from 'src/pages/ProductInventory/LedgerHistory';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import AssetQtyDialog from './AssetQtyDialog';
import Logs from './Logs';
import Receive from './Receive';
import Reject from './Reject';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { useGetWalkmeInstance, useSetWalkmeData } from 'src/components/CustomIntro';
import { generateReceiveProduct, generateRejectProduct } from 'src/pages/PurchaseOrder/walkmeSteps';

const ReceivingAsset = ({ purchaseOrderData, stepFullScreen, renderedFrom, checkReceivedProduct, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { generateColumns } = useColumns();
  const { selectedRecords, dataRows } = state;
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [receiveDialog, setReceiveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectProductDialog, setRejectProductDialog] = useState(null);

  const [logDialog, setLogDialog] = useState({ open: false, _id: '', detail: '' });
  const [historyDialog, setHistoryDialog] = useState({ open: false, _id: '', product: '', detail: '' });

  const [inventoryHistory, setInventoryHistory] = useState([]);

  const [columns, setColumns] = useState(null);
  const [addAssetDialog, setAddAssetDialog] = useState({ open: false, product: null });

  const [materialserializedAssets, setMaterialserializedAssets] = useState([]);
  const [materialSerialNumbers, setMaterialSerialNumbers] = useState([]);
  const { setWalkmeData } = useSetWalkmeData();
  const walkmeInstance = useGetWalkmeInstance();
  const isStepDataSet = useRef(false);

  useEffect(() => {
    fetchColumns();
    fetchProduct();
  }, [purchaseOrderData]);

  useEffect(() => {
    if (dataRows?.length) {
      let receiveIndex = dataRows.findIndex((e) => e.qty - (e?.actualReceived || 0) > 0);
      let rejectIndex = dataRows.findIndex((e) => e.qty - (e?.rejectQuantity || 0) > 0);
      let stepData = [];
      if (receiveIndex > -1) {
        stepData.push(generateReceiveProduct(user?.user?.brandPolicy?.storageLocation, receiveIndex, resources?.purchaseOrder?.titleSingular));
      }
      if (rejectIndex > -1) {
        stepData.push(generateRejectProduct(user?.user?.brandPolicy?.storageLocation, rejectIndex, resources?.purchaseOrder?.titleSingular));
      }
      if (walkmeInstance && walkmeInstance.type === 'flow' && !isStepDataSet.current) {
        isStepDataSet.current = true;
        let steps = generateReceiveProduct(user?.user?.brandPolicy?.storageLocation, 0, resources?.purchaseOrder?.titleSingular).steps;
        walkmeInstance.instance.push(steps);
        walkmeInstance.handleNext();
      }
      setWalkmeData(stepData);
    }
  }, [dataRows]);

  const fetchColumns = async () => {
    setColumns(null);
    var column = [];

    const productResult = await axiosInstance().get('/field?resource=Product&view=true');
    const productFields = productResult?.data?.data?.filter((e) =>
      ['productCategory', 'productNumber', 'serializedProduct', 'chartOfAccount'].includes(e?.fieldData?.fieldName)
    );
    column.push({
      accessor: 'index',
      Header: 'Index',
      width: 70,
      primaryField: true,
      sticky: 'left',
      Cell: ({ row }) => {
        return row.original['index'] ? <p className="text-truncate">{row.original.index}</p> : <NoDataCell />;
      },
      Footer: () => {
        return <>Total</>;
      }
    });
    column.push({
      accessor: 'type',
      Header: 'Type',
      width: 100,
      primaryField: true,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => {
        return row.original['type'] ? (
          <div>
            <p className="text-truncate" title={startCase(row.original.type)}>
              {startCase(row.original.type)}
            </p>
          </div>
        ) : (
          <NoDataCell />
        );
      }
    });
    column.push({
      accessor: 'detail',
      Header: 'Detail',
      width: 200,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <p className="text-truncate">{row.original.detail}</p>
          {[MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.serializedAsset].includes(row.original.type) && (
            <IconButton
              size="small"
              onClick={() => {
                if (row.original.type === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.assetId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          )}
        </div>
      )
    });
    column.push({
      accessor: 'description',
      Header: 'Description',
      width: 200,
      Cell: ({ row }) => {
        return row.original['description'] ? <p className="text-truncate">{row?.original?.description}</p> : <NoDataCell />;
      }
    });

    const productFieldsColumns = generateColumns(renderedFrom, productFields);
    productFieldsColumns?.forEach((e) => {
      column.push(e);
    });

    let fields = await fetch_child_resource_fields(CHILD_RESOURCE.purchaseOrderProduct, purchaseOrderData?.currency, false);

    const newColumns = generateColumns(renderedFrom, fields, null, false, purchaseOrderData?.currency);
    column = [...column, ...newColumns];
    column.push({
      accessor: 'assetQty',
      Header: 'Received Assets',
      width: 150,
      Cell: ({ row }) => (row.original['assetQty'] ? <p>{row.original['assetQty']}</p> : <NoDataCell />),
      Footer: (info) => {
        let rows = info.table.getExpandedRowModel().rows;
        return rows
          ?.filter((f) => f.original.hasOwnProperty('assetQty') && !isNaN(f.original['assetQty']))
          .reduce((sum, row) => row.original['assetQty'] + sum, 0);
      }
    });
    column.push({
      accessor: 'inventoryQty',
      Header: 'Received Quantity',
      width: 150,
      Cell: ({ row }) => (row.original['inventoryQty'] ? <p>{row.original['inventoryQty']}</p> : <NoDataCell />),
      Footer: (info) => {
        let rows = info.table.getExpandedRowModel().rows;
        return rows
          ?.filter((f) => f.original.hasOwnProperty('inventoryQty') && !isNaN(f.original['inventoryQty']))
          .reduce((sum, row) => row.original['inventoryQty'] + sum, 0);
      }
    });
    setColumns([
      ...column,
      ...[
        {
          accessor: 'action',
          Header: 'Actions',
          minWidth: 130,
          width: 130,
          sticky: 'right',
          disableFilters: true,
          disableSortBy: true,
          canDrag: false,
          Cell: ({ row }) => (
            <>
              {/* {permissions?.serializedAsset?.isCreate &&
                  row?.original?.serializedProduct && (row.original?.qty - (row.original?.actualReceived || 0) - (row?.original?.assetQty || 0)) > 0 &&
                  <HtmlTooltip title={`Create ${routes.serializedAsset.title}`}>
                    <IconButton
                      size="small"
                      aria-label={`Create ${routes.serializedAsset.title}`}
                      onClick={() => {
                        setAddAssetDialog({ open: true, product: row.original })
                      }}
                    >
                      <AddCircleOutlineIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </HtmlTooltip>
                } */}
              {permissions?.purchaseOrder?.isUpdate &&
              row?.original?.type === MATERIAL_TYPE.product &&
              allowedToEdit &&
              row?.original?.qty - (row?.original?.rejectQuantity || 0) &&
              ![PURCHASE_ORDER_STATUS.closed]?.includes(purchaseOrderData?.status) ? (
                <HtmlTooltip title="Reject">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="reject"
                      onClick={() => {
                        setRejectProductDialog(row.original);
                      }}
                    >
                      <Cancel fontSize="small" color={'error'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              ) : null}
              {row?.original?.type === MATERIAL_TYPE.product && (
                <HtmlTooltip title="History">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="History"
                      onClick={() => {
                        setHistoryDialog({
                          open: true,
                          _id: row?.original?._id,
                          product: row?.original?.materialId,
                          detail: row?.original?.detail
                        });
                      }}
                    >
                      <HistoryIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}
              {!['Serial Number', MATERIAL_TYPE.serializedAsset]?.includes(row?.original?.type) && (
                <HtmlTooltip title="Logs">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Log"
                      onClick={() => {
                        setLogDialog({ open: true, _id: row?.original?._id, detail: row?.original?.detail });
                      }}
                    >
                      <TrackChangesIcon fontSize="small" color={'primary'} />
                    </IconButton>
                  </span>
                </HtmlTooltip>
              )}
            </>
          )
        }
      ]
    ]);
  };

  const fetchProduct = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    try {
      const result = await axiosInstance().get(`${purchaseOrder.api}/product/${purchaseOrderData._id}`);
      const assets: any = await axiosInstance().get(`${purchaseOrder.api}/${purchaseOrderData._id}/assets`);
      const serializedAsset = assets?.data?.data?.serializedAsset;
      const productSerialNumber = assets?.data?.data?.productSerialNumber;

      setInventoryHistory(assets?.data?.data?.inventoryHistory);

      const serviceResponse: any = await axiosInstance().get(`${purchaseOrder.api}/service/${purchaseOrderData._id}`);
      const costResponce: any = await axiosInstance().get(`${purchaseOrder.api}/cost/${purchaseOrderData._id}`);

      const tempMaterialserializedAssets: any = {};
      const tempMaterialSerialNumbers: any = {};

      let rows = result?.data?.data?.map((item, index) => {
        let finalObject = prepareDataForGrid(item);
        finalObject['isChecked'] = selectedRecords.some((s) => s._id === item._id);
        finalObject['allowedToEdit'] = allowedToEdit;

        let res: any = {
          ...finalObject,
          index: index + 1,
          type: MATERIAL_TYPE.product,
          materialId: item?.productDetail?._id,
          detail: item?.productDetail?.productName,
          description: item?.productDetail?.productDescription,
          productNumber: item?.productDetail?.productNumber,
          serializedProduct: item?.productDetail?.serializedProduct,
          productCategory: item.productDetail?.productCategory,
          chartOfAccount: item.productDetail?.chartOfAccount
        };
        const subRows = [];
        serializedAsset
          ?.filter((e) => e?.product?.optionValue === res?.materialId && e?.uniqueId === res?._id)
          ?.forEach((e) => {
            subRows.push({
              index: `${res.index}.${subRows?.length + 1}`,
              _id: e?._id,
              detail: e.assetNumber,
              type: MATERIAL_TYPE.serializedAsset,
              assetId: e?._id,
              hideSelection: true
            });
          });
        productSerialNumber
          ?.filter((e) => e?.product === res?.materialId && e?.uniqueId === res?._id)
          ?.forEach((e) => {
            subRows.push({
              index: `${res.index}.${subRows?.length + 1}`,
              _id: e?._id,
              detail: e.serialNumber,
              type: 'Serial Number',
              assetId: e?._id,
              hideSelection: true
            });
          });
        res.subRows = subRows;
        res['assetQty'] = res?.subRows?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length;
        res['inventoryQty'] = item?.actualReceived
          ? (item?.actualReceived || 0) - res?.subRows?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
          : 0;
        tempMaterialserializedAssets[res?._id] = res?.subRows
          ?.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)
          ?.map((e) => {
            return { optionValue: e?._id, optionLabel: e?.detail };
          });
        tempMaterialSerialNumbers[res?._id] = res?.subRows
          ?.filter((e) => e.type === 'Serial Number')
          ?.map((e) => {
            return { optionValue: e?._id, optionLabel: e?.detail };
          });
        return res;
      });

      if (serviceResponse?.data?.data?.length) {
        serviceResponse?.data?.data?.forEach((ele) => {
          ele.detail = ele?.serviceDetail?.serviceName;
          ele.description = ele?.serviceDescription?.serviceDescription;
          ele.materialId = ele?.serviceDetail?._id;
          rows.push({ ...ele, index: rows?.length + 1, type: MATERIAL_TYPE.service });
        });
      }
      if (costResponce?.data?.data?.length) {
        costResponce?.data?.data?.forEach((ele) => {
          ele.detail = ele?.description;
          ele.materialId = ele?._id;
          rows.push({ ...ele, index: rows?.length + 1, type: MATERIAL_TYPE.manualEntry });
        });
      }
      checkReceivedProduct(rows);
      setMaterialserializedAssets(tempMaterialserializedAssets);
      setMaterialSerialNumbers(tempMaterialSerialNumbers);

      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const LeftSideContents = () => {
    return (
      <>
        {permissions?.purchaseOrder?.isUpdate && allowedToEdit && (
          <Button
            id={'receive-button'}
            variant={'contained'}
            color="primary"
            size="small"
            disabled={
              selectedRecords.length === 0 || (selectedRecords?.filter((e: any) => e.qty - (e?.actualReceived || 0) > 0).length > 0 ? false : true)
            }
            onClick={() => {
              setReceiveDialog(true);
            }}
          >
            Receive
          </Button>
        )}
        {permissions?.purchaseOrder?.isUpdate && allowedToEdit && (
          <Button
            id={'reject-button'}
            variant={'contained'}
            color="primary"
            size="small"
            disabled={
              selectedRecords.length === 0 || (selectedRecords?.filter((e: any) => e.qty - (e?.rejectQuantity || 0) > 0)?.length > 0 ? false : true)
            }
            onClick={() => {
              setRejectDialog(true);
            }}
          >
            Reject
          </Button>
        )}
      </>
    );
  };

  const previewDownloadProps = {
    fileName: `${resources?.purchaseOrder?.titleSingular}-${purchaseOrderData?.purchaseOrderNumber}`,
    resource: sidebarResource.purchaseOrder,
    referenceId: purchaseOrderData?._id,
    columns: columns,
    isSendEmail: true,
    button1Title: 'Ordered',
    button2Title: 'Received',
    defaultColumns: [
      'index',
      'type',
      'detail',
      'description',
      'qty',
      `price_${purchaseOrderData?.currency?.toLowerCase()}`,
      `totalPrice_${purchaseOrderData?.currency?.toLowerCase()}`,
      `tax_${purchaseOrderData?.currency?.toLowerCase()}`,
      `finalPrice_${purchaseOrderData?.currency?.toLowerCase()}`
    ]
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={false}
        previewDownloadProps={previewDownloadProps}
        leftSideContents={<LeftSideContents />}
        hasXpadding={true}
      />
      <Grid size={{xs:12, md:12, sm:12}}>
        {columns ? (
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchProduct}
              isClientSideGrid={true}
              hideSelection={[PURCHASE_ORDER_STATUS.closed]?.includes(purchaseOrderData?.status) ? true : false}
              expander={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {receiveDialog && (
        <Receive
          purchaseOrderID={purchaseOrderData._id}
          onClose={() => setReceiveDialog(false)}
          onSuccess={() => {
            setReceiveDialog(false);
            fetchProduct();
          }}
          material={selectedRecords.filter((d) => d.qty !== d.actualReceived)}
          purchaseOrderData={purchaseOrderData}
        />
      )}
      {addAssetDialog.open && (
        <AssetQtyDialog
          onClose={() => setAddAssetDialog({ open: false, product: null })}
          onSuccess={() => {
            setAddAssetDialog({ open: false, product: null });
            fetchProduct();
          }}
          product={addAssetDialog.product}
          purchaseOrderData={purchaseOrderData}
        />
      )}
      {rejectDialog && (
        <Reject
          purchaseOrderID={purchaseOrderData._id}
          onClose={() => setRejectDialog(false)}
          onSuccess={() => {
            setRejectDialog(false);
            fetchProduct();
          }}
          material={selectedRecords.filter(
            (d) => [MATERIAL_TYPE.product, MATERIAL_TYPE.service, MATERIAL_TYPE.manualEntry]?.includes(d.type) && d.qty !== (d?.rejectQuantity || 0)
          )}
          purchaseOrderData={purchaseOrderData}
          materialserializedAssets={materialserializedAssets}
          materialSerialNumbers={materialSerialNumbers}
        />
      )}
      {rejectProductDialog && (
        <Reject
          purchaseOrderID={purchaseOrderData._id}
          onClose={() => setRejectProductDialog(null)}
          onSuccess={() => {
            setRejectProductDialog(null);
            fetchProduct();
          }}
          material={[rejectProductDialog]}
          purchaseOrderData={purchaseOrderData}
          materialserializedAssets={materialserializedAssets}
          materialSerialNumbers={materialSerialNumbers}
        />
      )}
      {logDialog.open && (
        <Logs
          handleClose={() => setLogDialog({ open: false, _id: '', detail: '' })}
          detail={logDialog.detail}
          inventoryHistory={inventoryHistory?.filter((e) => e._id === logDialog._id)}
        />
      )}
      {historyDialog.open && (
        <History
          handleClose={() => setHistoryDialog({ open: false, _id: '', product: '', detail: '' })}
          productName={historyDialog.detail}
          referenceId={purchaseOrderData._id}
          uniqueId={historyDialog._id}
          product={historyDialog.product}
        />
      )}
    </>
  );
};

export default ReceivingAsset;
