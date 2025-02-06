import { Box, IconButton } from '@mui/material';
import { startCase } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportMenu from 'src/components/Helpers/ImportExportMenu';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, MATERIAL_TYPE, serializedAsset, sidebarResource, sublease, treeToFlatArray } from 'src/constants/helpers';
import { subleaseMessage } from 'src/constants/messageHelpers';
import ReceiveProduct from 'src/pages/Sublease/Receiving/ReceiveProduct';
import { generateReceiveStepReceive } from 'src/pages/Sublease/walkmeSteps';

const Receiving = ({ subleaseData, allowedToEdit, setNextStep, setNextStepToolTip, renderedFrom, stepFullScreen }) => {
  const { setWalkmeData } = useSetWalkmeData();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [receiveDialog, setReceiveDialog] = useState(false);

  const [pdfColumns, setPdfColumns] = useState([]);

  useEffect(() => {
    fetchFields();
    fetchAssetFields();
  }, []);

  const fetchAssetFields = () => {
    axiosInstance()
      .get(`/field?resource=${serializedAsset.resource}`)
      .then(({ data: { data } }) => {
        const newColumns = generateColumns(renderedFrom, data, routes.serializedAssetDetail.path);
        setPdfColumns(newColumns?.filter((e) => ['serialNumber', 'supplierSerialNumber']?.includes(e.field)));
      });
  };

  const handleWalkmeStep = (rows: any[]) => {
    if (rows?.length > 0 && rows[0]?.type === MATERIAL_TYPE.product && rows[0]?.qty - rows[0]?.assetQty > 0) {
      setWalkmeData([generateReceiveStepReceive(0)]);
    } else {
      setWalkmeData([]);
    }
  };

  const fetchFields = async () => {
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
        width: 100,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) =>
          row.original['type'] ? (
            <div>
              <p className="text-truncate">{startCase(row.original.type)}</p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 200,
        width: 200,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate"> {row.original.detail}</p>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                window.open(
                  `${
                    row.original.type === MATERIAL_TYPE.product
                      ? routes.productDetail.path
                      : row.original.type === MATERIAL_TYPE.package
                        ? routes.packagesDetail.path
                        : routes.serializedAssetDetail.path
                  }/${row.original.materialId}`
                );
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
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
      }
    ];
    coloum = [...coloum, ...newColumns];
    setColumns(coloum);
  };

  useEffect(() => {
    fetchData();
  }, [subleaseData]);

  const fetchData = async () => {
    setNextStep(false);

    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    var assets: any = [];

    const response = await axiosInstance().get(`${sublease.api}/productpackage/${subleaseData._id}`);

    data = response?.data?.data;
    assets = data.inventory;

    const rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === MATERIAL_TYPE.product ? parent.productDetail?.productName : parent.packageDetail?.packageName;
      parent.description =
        parent.type === MATERIAL_TYPE.product ? parent.productDetail?.productDescription : parent.packageDetail?.packageDescription;
      parent.assetQty = assets?.filter((e) => e._id === parent._id).length;
      parent.subRows = generateNestedRows(parent, data.material, assets);
    });

    if (assets?.length) {
      setNextStep(true);
      setNextStepToolTip(null);
    } else {
      setNextStep(false);
      setNextStepToolTip(subleaseMessage.receiveAssets);
    }
    handleWalkmeStep(rows);
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedRows = (parent, material, assets) => {
    const subRows: any = [];
    const child: any = material.filter((e) => e.parentId === parent._id);
    child.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (subRows?.length + 1);
      _subRow.detail = _subRow.productDetail?.productName;
      _subRow.description = _subRow.productDetail?.productDescription;
      _subRow.qty = parent.qty * _subRow.qty;
      _subRow.assetQty = assets?.filter((e) => e._id === _subRow._id).length;
      _subRow.subRows = generateNestedRows(_subRow, material, assets);
      subRows.push(_subRow);
    });
    const asset = assets?.filter((a) => a?._id === parent?._id);
    asset.forEach((_asset, j) => {
      _asset.index = parent.index + '.' + (subRows?.length + 1);
      _asset.type = MATERIAL_TYPE.serializedAsset;
      _asset.materialId = _asset?.inventory;
      _asset.detail = _asset?.inventoryDetail?.assetNumber;
      _asset.qty = 1;
      _asset.parentId = parent?._id;
      _asset._id = _asset?.inventory;
      subRows.push(_asset);
    });
    return subRows;
  };

  const previewDownloadProps =
    columns && pdfColumns
      ? {
          fileName: `${resources?.sublease?.titleSingular}-${subleaseData?.subleaseName}`,
          resource: sidebarResource.sublease,
          referenceId: subleaseData?._id,
          columns: [...columns?.filter((c) => c?.accessor != 'action'), ...pdfColumns],
          defaultColumns: ['index', 'type', 'detail', 'description', 'qty']
        }
      : null;

  const rightSideContents = () => {
    return (
      <>
        {allowedToEdit && treeToFlatArray(dataRows, 'subRows').filter((f) => f.type === MATERIAL_TYPE.serializedAsset)?.length > 0 && (
          <ImportExportMenu
            permissions={permissions?.serializedAsset}
            module={resources?.serializedAsset?.titlePlural}
            api={`${serializedAsset.api}/custom-template`}
            afterImportCompleted={() => {
              fetchData();
            }}
            isExportAllOrSomeFeature={true}
            isDownloadExcel={false}
            recordsToExport={
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
                ? selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
                : treeToFlatArray(dataRows, 'subRows').filter((f) => f.type === MATERIAL_TYPE.serializedAsset)?.length
            }
            ids={
              selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.length
                ? selectedRecords.filter((e) => e.type === MATERIAL_TYPE.serializedAsset)?.map((d) => d?._id)
                : treeToFlatArray(dataRows, 'subRows')
                    .filter((f) => f.type === MATERIAL_TYPE.serializedAsset)
                    ?.map((d) => d?._id)
            }
          />
        )}
        {allowedToEdit && (
          <ThemeButton
            disabled={selectedRecords?.filter((e) => e.type === MATERIAL_TYPE.product && e?.qty - e?.assetQty > 0).length ? false : true}
            id="receive-product"
            onClick={() => {
              setReceiveDialog(true);
            }}
            buttonType="theme"
          >
            Receive
          </ThemeButton>
        )}
      </>
    );
  };

  return (
    <>
      <DetailsPageHeader
        isAddButtonVisible={false}
        isActionButtonVisible={false}
        previewDownloadProps={previewDownloadProps}
        rightSideContents={rightSideContents()}
        hasXpadding
      />
      {columns ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
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
      {receiveDialog && (
        <ReceiveProduct
          onClose={() => {
            setReceiveDialog(false);
          }}
          material={treeToFlatArray(selectedRecords, 'subRows')
            ?.filter((e) => e.type === MATERIAL_TYPE.product && e?.qty - e?.assetQty > 0)
            ?.map((d) => ({
              uniqueId: d?._id,
              materialId: d?.materialId,
              qty: d?.qty,
              assetQty: d?.assetQty,
              productName: d?.productDetail?.productName
            }))}
          subleaseId={subleaseData?._id}
          subleaseData={subleaseData}
          onSuccess={() => {
            fetchData();
            setReceiveDialog(false);
          }}
        />
      )}
    </>
  );
};

export default Receiving;
