import { Box, Dialog, IconButton } from '@mui/material';
import { camelCase, startCase } from 'lodash';
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

const AddQuotationDataDialog = ({ onSuccess, onClose, fieldTicketData, isSubmitting = false, ids = [] }) => {
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
    const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency);
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
        disabled: true,
        width: 100,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
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
    const response = await axiosInstance().get(`${quotation.api}/productpackage/${fieldTicketData?.quotation?.optionValue}/${fieldTicketData?.quotationVersion?.optionValue}`);
    data = response?.data?.data?.material;
    data.forEach((parent, i) => {
      parent.index = i + 1;
      parent.type = parent.type;
      parent.detail = parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.productName :
        parent.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceName : parent?.packageDetail?.packageName;
      parent.description = parent.type === MATERIAL_TYPE.product ? parent?.productDetail?.productDescription :
        parent.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceDescription : parent?.packageDetail?.pacakgeDescription;
      parent.qty = parent.qty;
      parent.materialId = parent.materialId;
      parent._id = parent._id;
    });
    dispatch({ type: 'initialize', data: data, count: data?.length });
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
        title={`Add From Quotation`}
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
              textAddShow: true,
              disabled: isSubmitting || selectedRecords?.length === 0,
              loading: isSubmitting,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords);
            }}
            isAddButtonVisible={true}
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
