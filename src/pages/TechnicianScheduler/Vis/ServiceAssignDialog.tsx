import { Box, Dialog, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, displayDate } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const ServiceAssignDialog = ({ selectedResource, handleClose, handleAdd, viewType }) => {

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'technician_to_service_dialog';

  const {
    state: { resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (selectedResource) {
      fetchGridColumns();
      fetchData();
    }
  }, [selectedResource]);

  const fetchGridColumns = async () => {
    setColumns(null);

    const { data: { data } } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: selectedResource.resource,
          fieldNames: ['customerAccount', 'estimateStartDate', 'estimateEndDate']
        }
      ]
    });
    let fieldLabels = []
    if (data?.length) {
      fieldLabels = data[0]?.fieldNames;
    }
    const columns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'resourceNumber',
        Header: `${selectedResource?.titleSingular}`,
        width: 200,
        Cell: ({ row }) =>
          row.original['resourceNumber'] ? (
            <div className="flex items-center gap-1">
              <p title={row.original.resourceNumber}>{row.original.resourceNumber}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${selectedResource?.path}/${row.original.resourceId}`);
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
        accessor: 'customerAccount',
        Header: fieldLabels?.find((e) => e?.fieldName === 'customerAccount')?.fieldLabel || 'Customer Account',
        width: 250,
        Cell: ({ row }) =>
          row.original['customerAccount'] ? (
            <div className="flex items-center gap-1">
              <p title={row.original['customerAccount']}>{row.original['customerAccount']}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.customerAccountDetail.path}/${row.original.customerAccountId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      ...(viewType === 'service' ? [
        {
          accessor: 'serviceName',
          Header: 'Service Name',
          width: 250,
          Cell: ({ row }) =>
            row.original.serviceName && row.original.serviceId ? (
              <div className="flex items-center gap-1">
                <p title={row.original.serviceName}>{row.original.serviceName}</p>
                <IconButton
                  size="small"
                  onClick={() => {
                    window.open(`${routes.serviceMasterDetail.path}/${row.original.serviceId}`);
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
          accessor: 'competencyType',
          Header: 'Competency Type',
          width: 250,
          Cell: ({ row }) => (row.original['competencyType'] ? <p className="text-truncate">{row.original.competencyType}</p> : <NoDataCell />)
        },
        {
          accessor: 'competencies',
          Header: 'Competencies',
          width: 250,
          Cell: ({ row }) => (row.original['competencies'] ? <p className="text-truncate">{row.original.competencies}</p> : <NoDataCell />)
        }] : []),
      {
        accessor: 'estimateStartDate',
        Header: fieldLabels?.find((e) => e?.fieldName === 'estimateStartDate')?.fieldLabel || 'Estimate Start Date',
        width: 200,
        Cell: ({ row }) =>
          row.original['estimateStartDate'] ? <p className="text-truncate">{displayDate(row.original.estimateStartDate)}</p> : <NoDataCell />
      },
      {
        accessor: 'estimateEndDate',
        Header: fieldLabels?.find((e) => e?.fieldName === 'estimateEndDate')?.fieldLabel || 'Estimate End Date',
        width: 200,
        Cell: ({ row }) =>
          row.original['estimateEndDate'] ? <p className="text-truncate">{displayDate(row.original.estimateEndDate)}</p> : <NoDataCell />
      }
    ];
    setColumns(columns);
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `/technician-scheduler/un-assign-service?type=${selectedResource?.resource}`
    api += `&serviceWise=${viewType === 'job' ? 0 : 1}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        const rows: any = [];
        data?.forEach((ele, index) => {
          const obj: any = { ...ele };
          obj.index = index + 1;
          obj._id = ele?.service?.uniqueId;
          obj.resourceId = ele._id;
          obj.warehouse = ele?.warehouse?.optionValue;
          obj.fieldServiceOrder = ele?.fieldServiceOrder?.optionLabel;
          obj.fieldServiceOrderId = ele?.fieldServiceOrder?.optionValue;
          obj.serviceName = ele?.service?.serviceName;
          obj.serviceId = ele?.service?._id;
          obj.competencyType = ele?.service?.competencyType?.optionLabel;
          obj.competencies = ele?.service?.competencies?.map((e) => e?.optionLabel)?.toString();
          obj.service = ele?.service;
          obj.customerAccount = ele?.customerAccount?.optionLabel;
          obj.customerAccountId = ele?.customerAccount?.optionValue;
          obj.estimateStartDate = ele?.service?.estimateStartDate || ele?.estimateStartDate;
          obj.estimateEndDate = ele?.service?.estimateEndDate || ele?.estimateEndDate;
          obj.resourceNumber = ele?.fieldTicketNumber || ele?.fieldServiceOrderNumber || ele?.rentalJobName;
          rows.push(obj);
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Dialog
      TransitionComponent={CustomDialogTransition}
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      onClose={handleClose}
      aria-labelledby="assign-roles-dialog"
    >
      <CustomDialogHeader title={`Assign ${selectedResource?.title}`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent isFooterPresent={false}>
        {columns ? (
          <>
            <ListingPageHeader
              isActionButtonVisible={false}
              addButtonProps={{
                iconsEnabled: false,
                disabled: selectedRecords?.length === 0,
                text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
                customTextAdd: 'Assign'
              }}
              addButtonOnclick={() => handleAdd(selectedRecords)}
              isAddButtonVisible
            />
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideAction={true}
              isClientSideGrid={true}
            />
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default ServiceAssignDialog;
