import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { dateTimeFormat, gridLoadingTimeout } from 'src/constants/helpers';

const Alarms = ({ deviceTemplate, assetId }) => {
  const { state, dispatch } = useTableReducer();
  const { page, limit } = state;
  const toastConfig = useContext(CustomToastContext);

  const [alarmOptions, setAlarmOptions] = useState();

  const [selectedAlarm, setSelectedAlarm] = useState<{
    optionLabel: string,
    optionValue: string
  }>(null);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    try {
      const res = await axiosInstance().get<{ data: any[], count: number }>(`/report/iot/alerts`,
        {
          params: {
            asset: assetId,
            dataPoint: selectedAlarm.optionValue,
            page,
            limit
          }
        });
      const { data: rows, count } = res.data
      dispatch({ type: 'initialize', data: rows, count: count || 0 });
    } catch (e) {
      toastConfig.setToastConfig(e);
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const columns = [
    {
      accessor: 'time',
      Header: 'Date Time',
      Cell: ({ row: { original } }) => <>{moment(original.time).format(dateTimeFormat)}</>
    },
    {
      accessor: 'alertNumber',
      Header: 'Alert Number ',
      Cell: ({ row: { original } }) => <>{original.fieldValue}</>
    },
    {
      accessor: 'message',
      Header: 'Message',
      Cell: ({ row: { original } }) => <>{original.message}</>
    }
  ];

  useEffect(() => {
    if (!selectedAlarm) return
    fetchData()
  }, [selectedAlarm?.optionValue, page])

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
    }
  }, [deviceTemplate]);

  return (
    <Box display="flex" flexDirection="column">
      <Box ml={1}>
        <Autocomplete
          options={alarmOptions}
          getOptionLabel={(option) => (option && option?.optionLabel) || ''}
          style={{ width: '350px' }}
          value={selectedAlarm}
          onChange={(event, newValue: any) => {
            setSelectedAlarm(newValue);
          }}
          size="small"
          renderInput={(params) =>
            <TextField {...params}
              label="Select Alarm"
              size="small"
              variant="outlined" />}
        />
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={'iotChart_Alarms'}
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
