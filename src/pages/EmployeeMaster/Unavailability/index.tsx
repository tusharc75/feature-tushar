import { useState, useEffect, useContext } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { camelCase } from 'lodash';
import { displayDateTime, employeeMaster, sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import { FiExternalLink } from 'react-icons/fi';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ManageUnavailability from 'src/pages/EmployeeMaster/Unavailability/ManageUnavailability';

const renderedFrom = `${camelCase(sidebarResource.employeeMaster)}_Unavaiability`;

const Unavailability = ({id}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, filters, sorting, showFilteredRecordsOnly } = state;
  const [selectedResource, setSelectedResource] = useState(null);
  const [showUnavailbiltyDialog, setShowUnavailibilityDialog] = useState(false);

  const columns = [
    {
      accessor: 'title',
      Header: 'Title',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.title ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.title}</div>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'startDate',
      Header: 'Start Date',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.startDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.startDate)}>
              {displayDateTime(row?.original?.startDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      minWidth: 150,
      width: 150,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.endDate ? (
            <h5 className="text-truncate" title={displayDateTime(row?.original?.endDate)}>
              {displayDateTime(row?.original?.endDate)}
            </h5>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'reason',
      Header: 'Reason',
      minWidth: 150,
      width: 150,
      primaryField: true,
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.reasons ? (
            <div className="flex items-center gap-2">
              <div>{row?.original?.reasons}</div>
            </div>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, selectedResource, page, limit, filters, sorting, showFilteredRecordsOnly]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${employeeMaster.api}/unavailability/${id}`)
      .then(({ data: { data, count } }) => {
        console.log(data)
        dispatch({ type: 'initialize', data: data, count: count });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Box>
      <Box pt={2}>
        <ThemeButton startIcon={<AddIcon fontSize="small" />} onClick={() => setShowUnavailibilityDialog(true)}>Add</ThemeButton>
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showUnavailbiltyDialog && (
        <ManageUnavailability onClose={() => setShowUnavailibilityDialog(false)} onSuccess={() => fetchData()} id={id}/>
      )}
    </Box>
  );
};

export default Unavailability;
