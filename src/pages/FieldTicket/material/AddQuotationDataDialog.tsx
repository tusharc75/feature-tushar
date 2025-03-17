import { Box, Dialog, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { CHILD_RESOURCE, CustomDialogTransition, MATERIAL_TYPE, quotation, sidebarResource } from 'src/constants/helpers';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';

const AddQuotationDataDialog = ({ onSuccess, onClose, fieldTicketData, type, isSubmitting = false, ids = [] }) => {
  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_Quotation_Material`;

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { search, selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState([]);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (allFields?.length) {
      fetchData();
    }
  }, [allFields]);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.quotationProduct, fieldTicketData?.currency, false);
    setAllFields(JSON.parse(JSON.stringify(data)));
    data = data?.filter((f) => f?.isRead);
    const newColumns = generateColumns(
      renderedFrom,
      data?.map((e) => {
        return { ...e, fieldName: e.fieldName === 'qty' ? 'qtyDisplay' : e.fieldName };
      }),
      null,
      false,
      fieldTicketData?.currency
    );
    let column: any = [
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
        Cell: ({ row }) => (
          <div>
            <p className="text-truncate">
              {row.original['type'] === MATERIAL_TYPE.product
                ? row.original?.productDetail?.serializedProduct
                  ? '(Serialized)'
                  : '(Non-Serialized)'
                : row.original.type === MATERIAL_TYPE.service
                  ? row?.original?.serviceDetail?.serviceType && `(${row?.original?.serviceDetail?.serviceType})`
                  : ''}
            </p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            {row.original['detail'] ? <p className="text-truncate">{row.original.detail}</p> : <NoDataCell />}
            <IconButton
              size="small"
              onClick={() => {
                if (row.original['type'] === MATERIAL_TYPE.product) {
                  window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                } else if (row.original['type'] === MATERIAL_TYPE.serializedAsset) {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                } else if (row.original['type'] === MATERIAL_TYPE.service) {
                  window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                }
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      ...(user?.user?.brandPolicy?.leadTime ?
        [{
          accessor: 'leadTime',
          Header: 'Lead Time (Days)',
          Cell: ({ row }) => <div>{row.original['leadTime'] ? <p>{row.original['leadTime']}</p> : 0}</div>,
          Footer: (info) => {
            let rows = info.table.getExpandedRowModel().rows;
            const total = rows
              ?.filter((f) => f.original.hasOwnProperty('leadTime') && !isNaN(f.original['leadTime']))
              .reduce((sum, row) => parseInt(row.original['leadTime']) + sum, 0);
            return <>{total}</>;
          }
        }] : []),
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      }
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    var data: any = [];
    let rows = [];
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${fieldTicketData?.quotation?.optionValue}/${fieldTicketData?.quotationVersion?.optionValue}`);
    data = response?.data?.data;
    if (type === MATERIAL_TYPE.product) {
      rows = data?.material?.filter(
        (e) =>
          e.type === MATERIAL_TYPE.product &&
          !e?.productDetail?.serializedProduct &&
          !ids?.some((ele) => ele === e.materialId)
      );
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.product;
        parent.detail = parent?.productDetail?.productName;
        parent.description = parent?.productDetail?.productDescription;
        parent.qtyDisplay = parent.qty;
        parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
        parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
        parent.materialId = parent?.productDetail?._id;
        parent._id = parent?.productDetail?._id;
      });
    } else if (type === MATERIAL_TYPE.service) {
      rows = data?.material?.filter((e) => e.type === MATERIAL_TYPE.service && !ids?.some((ele) => ele === e._id));
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.type = MATERIAL_TYPE.service;
        parent.detail = parent?.serviceDetail?.serviceName;
        parent.description = parent?.serviceDetail?.serviceDescription;
        parent.qtyDisplay = parent.qty;
        parent.leadTimeData = Array.isArray(parent.leadTime) ? parent.leadTime : [];
        parent.leadTime = Array.isArray(parent.leadTime) ? `${parent?.leadTime?.reduce((acc, e) => acc + parseInt(e?.days || 0), 0) || 0}` : 0;
        parent.materialId = parent?.serviceDetail?._id;
        parent._id = parent?.serviceDetail?._id;
      });
    }
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={true}
      TransitionComponent={CustomDialogTransition}
      open={true}
      onClose={onClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={type === MATERIAL_TYPE.product ? `Add Quotation Consumables` : `Add Quotation Services`}
        showManimizeMaximize={false}
        showRequiredLabel={false}
        onClose={onClose}
      />
      <CustomDialogContent isFooterPresent={false}>
        <>
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            addButtonProps={{
              iconsEnabled: false,
              disabled: isSubmitting || selectedRecords?.length === 0,
              loading: isSubmitting,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords);
            }}
            isAddButtonVisible
            setQueryString={false}
          />
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              isClientSideGrid={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </>
      </CustomDialogContent>
    </Dialog>
  );
};

export default AddQuotationDataDialog;
