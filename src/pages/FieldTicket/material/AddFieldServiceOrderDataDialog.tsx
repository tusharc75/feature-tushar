import { Box, Dialog, IconButton } from '@mui/material';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import { fetch_child_resource_fields_perm } from 'src/components/ChildResourceField';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { AccessorFunction, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import DropdownCell from 'src/components/CustomReactTable/Cells/DropdownCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CHILD_RESOURCE, CustomDialogTransition, fieldServiceOrder, MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';

const AddFieldServiceOrderDataDialog = ({ onClose, fieldTicketData, materialType, isSubmitting = false, onSuccess, ignoreIds = [] }) => {

  const renderedFrom = `${camelCase(sidebarResource.fieldTicket)}_FieldServiceOrder_Material`;
  const {
    state: { permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;
  const { generateColumns } = useColumns();

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    fetchData();
  }, [columns]);

  const fetchFields = async () => {
    let data = await fetch_child_resource_fields_perm(CHILD_RESOURCE.fieldServiceOrderDetails, fieldTicketData?.currency, false);
    data = data?.filter((f) => f?.isRead);
    const newColumns = generateColumns(renderedFrom, data, null, false, fieldTicketData?.currency);
    const fieldLabelResponce = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: sidebarResource.serviceMaster,
          fieldNames: ['competencyType', 'competencies']
        }
      ]
    });
    const serviceFields = fieldLabelResponce?.data?.data?.find((e) => e.resource === sidebarResource.serviceMaster)?.fieldNames || []
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
        accessor: 'detail',
        Header: 'Details',
        minWidth: 300,
        width: 300,
        disabled: true,
        sticky: isMobile || isTablet ? 'none' : 'left',
        Cell: ({ row, table }) =>
          row.original.detail ? (
            <div className="flex items-center gap-2">
              <p> {row.original.detail}</p>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === MATERIAL_TYPE.service) {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.materialId}`);
                  }
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
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
      ...(serviceFields?.find((e) => e.fieldName === 'competencyType') ? [{
        accessor: 'competencyType',
        Header: serviceFields?.find((e) => e.fieldName === 'competencyType')?.fieldLabel,
        width: 250,
        Cell: ({ row }) => <DropdownCell
          permissions={permissions}
          permissionForLinks={{}}
          field={{
            fieldName: 'competencyType',
            lookupResource: sidebarResource.competencyType
          }}
          original={row?.original}
        />,
        accessorFn: (original) => AccessorFunction(original, 'competencyType')
      }] : []),
      ...(serviceFields?.find((e) => e.fieldName === 'competencies') ? [{
        accessor: 'competencies',
        Header: serviceFields?.find((e) => e.fieldName === 'competencies')?.fieldLabel,
        width: 250,
        Cell: ({ row }) =>
          <DropdownCell
            permissions={permissions}
            permissionForLinks={{}}
            field={{
              fieldName: 'competencies',
              lookupResource: sidebarResource.competencies
            }}
            original={row?.original}
          />,
        accessorFn: (original) => AccessorFunction(original, 'competencies')
      }] : [])
    ];
    column = [...column, ...newColumns];
    setColumns(column);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    let data;
    const response = await axiosInstance().get(`${fieldServiceOrder.api}/${fieldTicketData?.fieldServiceOrder?.optionValue}/material`);
    data = response?.data?.data?.material;

    let rows = data?.filter((d: any) => d?.type === materialType && !d.parentId && !ignoreIds?.includes(d?._id));
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === MATERIAL_TYPE.service ? parent.serviceDetail?.serviceName : MATERIAL_TYPE.product ? parent.productDetail?.productName : '';
      parent.description = parent.type === MATERIAL_TYPE.service ? parent?.serviceDetail?.serviceDescription : MATERIAL_TYPE.product ? parent.productDetail?.productDescription : '';
      parent.competencyType = parent?.serviceDetail?.competencyType;
      parent.competencies = parent?.serviceDetail?.competencies;
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={true}
      slots={{ transition: CustomDialogTransition }}
      open={true}
      onClose={onClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader
        title={`Add From ${resources?.fieldServiceOrder?.titleSingular}`}
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
              textAddShow: true,
              disabled: isSubmitting || selectedRecords?.length === 0,
              loading: isSubmitting,
              text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : ''
            }}
            addButtonOnclick={() => {
              onSuccess(selectedRecords);
            }}
            isAddButtonVisible={true}
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

export default AddFieldServiceOrderDataDialog;
