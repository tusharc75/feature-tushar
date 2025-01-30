import { Box, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { dateTimeFormat24Hours, displayDateTime, gridLoadingTimeout } from 'src/constants/helpers';

const renderedFrom = 'iotChart_Alarms';

const Alarms = ({ deviceTemplate, assetId }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit } = state;
  const toastConfig = useContext(CustomToastContext);

  const [alarmOptions, setAlarmOptions] = useState(null);
  const [selectedAlarm, setSelectedAlarm] = useState({ optionValue: 'All', optionLabel: 'All' });
  const [alertOptions, setAlertOptions] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState([]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/report/iot-alerts${queryString}`)
      .then(({ data: { data, count } }) => {
        dispatch({ type: 'initialize', data: data, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&asset=${assetId}`;
    if (selectedAlarm?.optionValue === 'All') {
      deepFilter = deepFilter + `&dataPoints=${alarmOptions?.map((e) => e.optionValue)?.toString()}`;
    } else {
      deepFilter = deepFilter + `&dataPoints=${selectedAlarm.optionValue}`;
    }
    if (selectedAlert?.length > 0) {
      deepFilter = deepFilter + `&fieldValue=${selectedAlert}`;
    }
    return `${deepFilter}`;
  };

  const columns = [
    {
      accessor: 'fieldName',
      Header: 'Alert',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <div>{row?.original?.fieldName}</div>
    },
    {
      accessor: 'time',
      Header: 'Date Time',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <div>{displayDateTime(row?.original.time, dateTimeFormat24Hours)}</div>
    },
    {
      accessor: 'alertNumber',
      Header: 'Alert Number ',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => <div>{row?.original?.fieldValue}</div>
    },
    {
      accessor: 'message',
      Header: 'Message',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => (row?.original.message ? <div>{row?.original.message}</div> : <NoDataCell />)
    }
  ];

  useEffect(() => {
    if (alarmOptions) {
      fetchData();
    }
  }, [page, limit, alarmOptions, selectedAlarm, selectedAlert]);

  useEffect(() => {
    if (deviceTemplate) {
      const query = [{ field: 'deviceTemplate', term: deviceTemplate }];
      const deepFilter = [
        { field: 'active', term: 'yes' },
        { field: 'alarm', term: 'yes' }
      ];
      axiosInstance()
        .get(`${routes.iotDataPoints.path}?filterById=${JSON.stringify(query)}&deepFilter=${JSON.stringify(deepFilter)}&filterType=and`)
        .then(({ data: { data } }) => {
          setAlarmOptions(
            data?.data?.map((d) => ({
              optionValue: d?._id,
              optionLabel: d?.fieldLabel
            })) || []
          );
        });

      axiosInstance()
        .get(`${routes?.deviceTemplateAlert?.path}?filterById=${JSON.stringify(query)}&filterType=and`)
        .then(({ data: { data } }) => {
          setAlertOptions(data?.map((d) => d?.alertNumber));
        });
    }
  }, [deviceTemplate]);

  return (
    <Box display="flex" flexDirection="column">
      <div className="flex gap-2">
        {alarmOptions && (
          <Autocomplete
            options={[{ optionValue: 'All', optionLabel: 'All' }, ...alarmOptions]}
            getOptionLabel={(option) => (option && option?.optionLabel) || ''}
            style={{ width: '350px' }}
            value={selectedAlarm}
            onChange={(event, newValue: any) => {
              setSelectedAlarm(newValue);
            }}
            disableClearable
            size="small"
            renderInput={(params) => <TextField {...params} label="Select Alarm" size="small" variant="outlined" />}
          />
        )}
        {alertOptions && (
          <Autocomplete
            options={alertOptions || []}
            multiple
            getOptionLabel={(option: any) => option || ''}
            style={{ width: '350px' }}
            value={selectedAlert}
            onChange={(event, newValue: any) => {
              setSelectedAlert(newValue);
            }}
            size="small"
            renderInput={(params) => <TextField {...params} label="Select Alert" size="small" variant="outlined" />}
          />
        )}
      </div>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          hideSelection={true}
          hideAction={true}
        />
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Box>
  );
};

export default Alarms;
