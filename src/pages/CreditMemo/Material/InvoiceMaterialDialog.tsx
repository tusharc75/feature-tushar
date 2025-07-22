import { Box, Dialog, IconButton } from "@mui/material";
import { camelCase, startCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { isMobile, isTablet } from "react-device-detect";
import { FiExternalLink } from "react-icons/fi";
import axiosInstance from "src/axios/axiosInstance";
import { fetch_child_resource_fields } from "src/components/ChildResourceField";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomReactTable, { useColumns, useTableReducer } from "src/components/CustomReactTable";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import routes from "src/components/Helpers/Routes";
import { CHILD_RESOURCE, CustomDialogTransition, invoice, MATERIAL_TYPE, sidebarResource } from "src/constants/helpers";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import { ListingPageHeader } from '../../../components/PageHeaders';

const InvoiceMaterialDialog = ({ creditMemoData, onClose, onSuccess, loading }) => {

  const renderedFrom = `${camelCase(sidebarResource.invoice)}_Material_Credit_Memo`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null)

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchInvoiceData()
  }, [creditMemoData])

  useEffect(() => {
    if (invoiceData) {
      fetchFields();
      fetchData();
    }
  }, [invoiceData]);

  const fetchInvoiceData = async () => {
    axiosInstance().get(`${invoice.api}/${creditMemoData?.invoice?.optionValue}`)
      .then(({ data: { data } }) => {
        setInvoiceData(data)
      }).catch((error) => {
        toastConfig.setToastConfig(error);
      })
  }

  const fetchFields = async () => {
    let data = await fetch_child_resource_fields(CHILD_RESOURCE.invoiceProduct, invoiceData?.currency, false);
    const newColumns = generateColumns(renderedFrom, data, null, false, invoiceData?.currency);
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
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        disabled: true,
        width: 300,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate">{row.original?.detail}</p>
            {![MATERIAL_TYPE.manualEntry, MATERIAL_TYPE.other]?.includes(row.original['type']) && (
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.product) {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else if (row.original.type === MATERIAL_TYPE.serializedAsset) {
                    window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            )}
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

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    var data: any = [];
    const response = await axiosInstance().get(`${invoice.api}/material/${invoiceData._id}`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => !e.parentId);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail =
        parent.type === MATERIAL_TYPE.product
          ? parent.productDetail?.productName
          : parent.type === MATERIAL_TYPE.package
            ? parent.packageDetail?.packageName
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent.serializedAssetDetail?.assetNumber
              : parent.type === MATERIAL_TYPE.service
                ? parent.serviceDetail?.serviceName
                : parent.detail || '';

      parent.description =
        parent.type === MATERIAL_TYPE.product
          ? parent?.productDetail?.productDescription
          : parent.type === MATERIAL_TYPE.package
            ? parent?.packageDetail?.packageDescription
            : parent.type === MATERIAL_TYPE.serializedAsset
              ? parent?.serializedAssetDetail?.product?.productDescription
              : parent.type === MATERIAL_TYPE.service
                ? parent?.serviceDetail?.serviceDescription
                : parent.description || '';

      parent.qty = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow.productDetail?.productName
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow.packageDetail?.packageName
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? _subRow.serializedAssetDetail.assetNumber
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow.serviceDetail?.serviceName
                : _subRow?.detail;
      _subRow.description =
        _subRow.type === MATERIAL_TYPE.product
          ? _subRow?.productDetail?.productDescription
          : _subRow.type === MATERIAL_TYPE.package
            ? _subRow?.packageDetail?.packageDescription
            : _subRow.type === MATERIAL_TYPE.serializedAsset
              ? parent.description
              : _subRow.type === MATERIAL_TYPE.service
                ? _subRow?.serviceDetail?.serviceDescription
                : '';
      _subRow.hideSelection = true
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={onClose}
      aria-labelledby="invoice-material-dialog"
    >
      <CustomDialogHeader
        title={`${resources?.invoice?.titleSingular} - ${creditMemoData?.invoice?.optionLabel}`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <>
          <ListingPageHeader
            isActionButtonVisible={false}
            addButtonProps={{
              iconsEnabled: false,
              disabled: loading || selectedRecords?.length === 0,
              loading: loading,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
              textAddShow: true
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords?.map(r => r?._id));
            }}
            isAddButtonVisible={true}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              isClientSideGrid={true}
              hideAction={true}
              hideExportTable={true}
              expander={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  )
}

export default InvoiceMaterialDialog;
