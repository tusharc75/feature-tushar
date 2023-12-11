import { Box, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTableNew';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';

const Alarms = ({ deviceTemplate }) => {
  const { state, dispatch } = useTableReducer();

  const [alarmOptions, setAlarmOptions] = useState([]);
  const [selectedAlarm, setSelectedAlarm] = useState(null);

  const columns = [
    {
      accessor: 'dateTime',
      Header: 'Date Time',
      Cell: ({ row }) => <>dateTime</>
    },
    {
      accessor: 'alertNumber ',
      Header: 'Alert Number ',
      Cell: ({ row }) => <>alertNumber</>
    },
    {
      accessor: 'message',
      Header: 'Message',
      Cell: ({ row }) => <>message</>
    }
  ];

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
          onChange={(event, newValue) => {
            setSelectedAlarm(newValue);
          }}
          size="small"
          renderInput={(params) => <TextField {...params} label="Select DataPoint" size="small" variant="outlined" />}
        />
      </Box>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 300px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={'iotChart_Alarms'}
          refreshGrid={() => {}}
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
