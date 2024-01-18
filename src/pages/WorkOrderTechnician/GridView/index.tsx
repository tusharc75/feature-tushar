import { Box, Tab, Tabs } from '@material-ui/core';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';

const GridView = ({ serviceStatus, resource, resourceData }) => {
  const renderedFrom = camelCase(routes?.workOrderTechnician.title);
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { permissions, user }
  }: any = useData();

  const { state, dispatch } = useTableReducer();
  const { page, limit, sorting } = state;

  const [tabValue, setTabValue] = useState('');

  useEffect(() => {
    setTabValue(serviceStatus[0]);
  }, [serviceStatus]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: string) => {
    setTabValue(newValue);
  };

  const columns = [
    {
      accessor: 'serviceName',
      Header: 'Service',
      Cell: ({ row }) => (row.original['serviceName'] ? <h5 className="text-truncate">{row.original.serviceName}</h5> : <NoDataCell />)
    },
    {
      accessor: 'workOrderNumber',
      Header: 'Work Order',
      Cell: ({ row }) => (row.original['workOrderNumber'] ? <h5 className="text-truncate">{row.original.workOrderNumber}</h5> : <NoDataCell />)
    },
    {
      accessor: 'reference',
      Header: 'Reference',
      Cell: ({ row }) => (row.original['reference'] ? <h5 className="text-truncate">{row.original.reference}</h5> : <NoDataCell />)
    },
    {
      accessor: 'spoolNumber',
      Header: 'Spool Number',
      Cell: ({ row }) => (row.original['spoolNumber'] ? <h5 className="text-truncate">{row.original.spoolNumber}</h5> : <NoDataCell />)
    },
    {
      accessor: 'serializedAsset',
      Header: 'Asset',
      Cell: ({ row }) => (row.original['serializedAsset'] ? <h5 className="text-truncate">{row.original.serializedAsset}</h5> : <NoDataCell />)
    },
    {
      accessor: 'assignedWorkStations',
      Header: 'Work Stations',
      Cell: ({ row }) =>
        row.original['assignedWorkStations'] ? <h5 className="text-truncate">{row.original.assignedWorkStations}</h5> : <NoDataCell />
    },
    ...(user?.user?.brandPolicy?.workOrderTimer
      ? [
          {
            accessor: 'stepData',
            Header: 'Time',
            Cell: ({ row }) => (row.original['stepData'] ? <h5 className="text-truncate">{row.original.stepData}</h5> : <NoDataCell />)
          }
        ]
      : []),
    {
      accessor: 'estimateCompleteDate',
      Header: 'Due Date',
      Cell: ({ row }) =>
        row.original['estimateCompleteDate'] ? <h5 className="text-truncate">{row.original.estimateCompleteDate}</h5> : <NoDataCell />
    }
  ];

  useEffect(() => {
    if (tabValue) {
      fetchData();
    }
  }, [page, limit, sorting, tabValue, resourceData]);

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&status=${tabValue}`;

    if (resource && resourceData) {
      deepFilter = `${deepFilter}&${camelCase(resource?.resource)}=${resourceData?.optionValue}`;
    }

    return deepFilter;
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`/work-order-technician${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['serviceName'] = u?.service?.serviceName;
          finalObject['workOrderNumber'] = u?.workOrderDetail?.workOrderNumber;
          finalObject['reference'] = u?.workOrderDetail?.repairOrder?.optionLabel || u?.workOrderDetail?.productionOrder?.optionLabel;
          finalObject['spoolNumber'] = u?.workOrderDetail?.spoolNumber;
          finalObject['serializedAsset'] = u?.workOrderDetail?.serializedAsset?.optionLabel;
          finalObject['estimateCompleteDate'] = u?.workOrderDetail?.estimateCompleteDate;
          return finalObject;
        });

        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  return (
    <>
      {serviceStatus?.length ? (
        <Box>
          <Tabs
            className="new-tab-container-v1"
            value={tabValue}
            onChange={handleMainTabChange}
            textColor="primary"
            TabIndicatorProps={{
              style: {
                height: 0
              }
            }}
          >
            {serviceStatus?.map((status, i) => {
              return (
                <Tab
                  label={<div className="tab-font">{status}</div>}
                  value={status}
                  aria-controls={`a11y-tabpanel-${i}`}
                  id={`a11y-tab-${i}`}
                  className={'tabLayout'}
                />
              );
            })}
          </Tabs>

          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 383px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              refreshGrid={fetchData}
              hideAction={true}
              hideSelection={true}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      ) : (
        <p>Please Select Status !! </p>
      )}
    </>
  );
};

export default GridView;
