import Box from '@mui/material/Box/Box';
import { useState, useEffect, useContext, Fragment } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { IconButton } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { displayDate } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import { fetch_rental_technician_fields } from 'src/components/RentalManagment/helper';
import { FiExternalLink } from 'react-icons/fi';
import routes from 'src/components/Helpers/Routes';

const Technicians = ({ rentalManagementData }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = `${camelCase(sidebarResource.scheduleAndDispatch)}_${camelCase(sidebarResource.rentalManagement)}_technician`;

  const [columns, setColumns] = useState(null);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, [rentalManagementData]);

  const fetchColumns = async () => {
    let data = await fetch_rental_technician_fields(rentalManagementData?.currency, false);
    const column: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'technicianName',
        Header: 'Name',
        width: 250,
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p>{row.original.technicianName}</p>
            <Box>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.employeeMasterDetail.path}/${row.original?.technicianId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </Box>
          </div>
        )
      },
      {
        accessor: 'service',
        Header: 'Service',
        width: 250,
        Cell: ({ row }) =>
          row.original?.service ? (
            <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original?.serviceId}`} target="_blank">
              {row.original?.service}
            </a>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 200,
        Cell: ({ row }) => (row.original['status'] ? <p>{row.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencyType',
        Header: 'Competency Type',
        width: 250,
        Cell: ({ row }) => (row.original['competencyType'] ? <p>{row.original?.competencyType}</p> : <NoDataCell />)
      },
      {
        accessor: 'competencies',
        Header: 'Competencies',
        width: 250,
        Cell: ({ row }) => (row.original['competencies'] ? <p>{row.original?.competencies}</p> : <NoDataCell />)
      },
      {
        accessor: 'startDate',
        Header: 'Start Date',
        width: 250,
        Cell: ({ row }) => (row.original?.startDate ? <p>{displayDate(row.original?.startDate)}</p> : <NoDataCell />)
      },
      {
        accessor: 'endDate',
        Header: 'End Date',
        width: 250,
        Cell: ({ row }) => (row.original?.endDate ? <p>{displayDate(row.original?.endDate)}</p> : <NoDataCell />)
      }
    ];
    const newColumns = generateColumns(
      renderedFrom,
      data?.filter((f) => f?.isRead),
      null,
      false,
      rentalManagementData?.currency
    );
    setColumns([...column, ...newColumns]);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    let api = `${rentalManagement.api}/technician?rentalJobId=${rentalManagementData?._id}`;
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.technician?.map((u, i) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.index = i + 1;
          res.technicianName = u?.technician['firstName'] + ' ' + u?.technician['lastName'];
          res.technicianId = u?.technician['_id'];
          res.competencyType = u?.technician['competencyType']?.optionLabel;
          res.competenciesWithIds = u?.technician['competencies'];
          res.competencies = u?.technician['competencies']?.map((e) => e?.optionLabel)?.toString();

          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Fragment>
      {columns && dataRows ? (
        <CustomReactTable
          height={'calc(100vh - 393px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          refreshGrid={fetchData}
          renderedFrom={renderedFrom}
          isClientSideGrid={true}
          hideSelection={true}
          hideAction={true}
        />
      ) : (
        <Box p={2} height={300}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Fragment>
  );
};

export default Technicians;
