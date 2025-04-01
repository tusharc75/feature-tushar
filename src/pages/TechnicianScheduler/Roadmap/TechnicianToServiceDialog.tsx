import { Box, Dialog, IconButton } from '@mui/material';
import dayjs from 'dayjs';
import { useContext, useEffect, useMemo, useState } from 'react';
import { FiExternalLink } from 'react-icons/fi';
import axiosInstance from 'src/axios/axiosInstance';
import ButtonMenu from 'src/components/ButtonMenu';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomDialogTransition, displayDate, fieldServiceOrder, fieldTicket, rentalManagement } from 'src/constants/helpers';
import { useTechnicianResources } from 'src/pages/TechnicianScheduler/useTechnicianResources';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const TechnicianToServiceDialog = ({ selectedResource, handleClose, technician, handleSucess }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = 'technician_to_service_dialog';

  const {
    state: { resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { selectedRecords } = state;

  const [selectedType, setSelectedType] = useState(selectedResource);
  const technicianResources = useTechnicianResources(toastConfig, setSelectedType);
  const [columns, setColumns] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headerSLot = useMemo(() => {
    if (technicianResources)
      return (
        <ButtonMenu
          showChevron={true}
          getLabel={(d) => d.title}
          items={technicianResources}
          getSelectedMenuItem={(item) => item.key === selectedType.key}
          onItemClick={(e, item) => {
            setSelectedType(item);
          }}
        >
          <span className="flex items-center gap-2 [&_svg]:text-[18px]">{selectedType?.title}</span>
        </ButtonMenu>
      );
    return null;
  }, [selectedType?.key, selectedType?.title, technicianResources]);

  useEffect(() => {
    if (selectedType) {
      fetchGridColumns();
      fetchData();
    }
  }, [selectedType]);

  const fetchGridColumns = () => {
    setColumns(null);
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
        Header: `${selectedType?.key === 'fieldTicket' ? resources?.fieldTicket?.titleSingular : selectedType?.key === 'fieldServiceOrder' ? resources?.fieldServiceOrder?.titleSingular : resources?.rentalManagement?.titleSingular}`,
        width: 200,
        Cell: ({ row }) =>
          row.original['resourceNumber'] ? (
            <div className="flex items-center gap-1">
              <p title={row.original.resourceNumber}>{row.original.resourceNumber}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(
                    `${selectedType?.key === 'fieldTicket' ? routes.fieldTicketDetail.path : selectedType?.key === 'fieldServiceOrder' ? routes.fieldServiceOrderDetail.path : routes.rentalManagementDetail.path}/${row.original.resourceId}`
                  );
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
      },
      {
        accessor: 'customerAccount',
        Header: 'Customer Account',
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
      {
        accessor: 'estimateStartDate',
        Header: 'Estimate Start Date',
        width: 200,
        Cell: ({ row }) =>
          row.original['estimateStartDate'] ? <p className="text-truncate">{displayDate(row.original.estimateStartDate)}</p> : <NoDataCell />
      },
      {
        accessor: 'estimateEndDate',
        Header: 'Estimate End Date',
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
    axiosInstance()
      .get(`/technician-scheduler/un-assign-service?type=${selectedType?.resource}`)
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
          obj.estimateStartDate = ele?.service?.estimateStartDate;
          obj.estimateEndDate = ele?.service?.estimateEndDate;
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

  const leftSideContents = () => {
    return headerSLot;
  };

  const handleAssign = () => {
    const data: any = [];
    selectedRecords.forEach((d) => {
      const element: any = {};
      element.technician = technician?._id;
      element.uniqueId = d?._id;
      element.service = d?.serviceId;
      element.warehouse = d?.warehouse;
      element.startDate = d?.estimateStartDate || dayjs.tz().toDate();
      element.endDate = d?.estimateEndDate || dayjs.tz().toDate();
      if (selectedType?.key === 'fieldTicket') {
        element.fieldTicket = d?.resourceId;
      } else if (selectedType?.key === 'rentalJob') {
        element.rentalJob = d?.resourceId;
      } else {
        element.fieldServiceOrder = d?.resourceId;
      }
      data.push(element);
    });
    const baseApi =
      selectedType?.key === 'fieldTicket'
        ? fieldTicket.api
        : selectedType?.key === 'rentalJob'
          ? rentalManagement.api
          : selectedType?.key === 'fieldServiceOrder'
            ? fieldServiceOrder.api
            : '';
    setIsSubmitting(true);
    axiosInstance()
      .post(`${baseApi}/technician`, { technician: data })
      .then(() => {
        handleSucess();
        setIsSubmitting(false);
      })
      .catch((error) => {
        setIsSubmitting(false);
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
      <CustomDialogHeader title={`Assign ${selectedType?.title}`} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent isFooterPresent={false}>
        {columns ? (
          <>
            <ListingPageHeader
              isActionButtonVisible={false}
              leftSideContents={leftSideContents()}
              addButtonProps={{
                iconsEnabled: false,
                disabled: isSubmitting || selectedRecords?.length === 0,
                loading: isSubmitting,
                text: selectedRecords?.length > 0 ? `(${selectedRecords?.length})` : '',
                customTextAdd: 'Assign'
              }}
              addButtonOnclick={handleAssign}
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

export default TechnicianToServiceDialog;
