import { Box, IconButton, TextField } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { camelCase, kebabCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getCompletedByField, getStaticFields, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import { useHistory } from 'react-router-dom';
import { Autocomplete } from '@material-ui/lab';
import { WORK_FLOW_STATUS } from 'src/constants/helpers';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = camelCase(sidebarResource.workflowReport);

const WorkFlowReport = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [workFlowOptions, setWorkFlowOptions] = useState(null);
  const [selectedWorkFlow, setSelectedWorkFlow] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState([WORK_FLOW_STATUS.open, WORK_FLOW_STATUS.inProgress]);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    axiosInstance()
      .get(`${routes?.workflow?.path}`)
      .then(({ data: { data } }) => {
        setWorkFlowOptions(data);
      })
      .catch((e) => {
        toastConfig.setToastConfig(e);
      });
  }, []);

  const fetchGridColumns = () => {
    const columns = [
      {
        accessor: 'workflowNumber',
        Header: 'Workflow Number',
        width: 150,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row?.original?.workflowNumber}>
              {row?.original?.workflowNumber}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.workflowReportDetail.path}/${row?.original?._id}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'reference',
        Header: 'Reference',
        width: 150,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row?.original?.reference}>
              {row?.original?.reference}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(
                  `${routes[`${camelCase(row?.original?.resource)}`]?.path || kebabCase(row?.original?.resource)}/detail/${row?.original?.referenceId}`
                );
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'resource',
        Header: 'Resource',
        width: 150,
        Cell: ({ row }) => <div>{row?.original?.resource}</div>
      },
      {
        accessor: 'workflow',
        Header: 'Workflow',
        width: 150,
        Cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <p className="text-truncate" title={row?.original?.workflow}>
              {row?.original?.workflow}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.workflow.path}/${row?.original?.workflowId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 150,
        Cell: ({ row }) => <div>{row?.original?.status}</div>
      },
      ...getStaticFields(),
      ...getCompletedByField()
    ];
    setColumns(columns);
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [selectedWorkFlow, selectedStatus]);

  const getQueryString = () => {
    let deepFilter = '?';
    if (selectedWorkFlow) {
      deepFilter = `${deepFilter}&workflowId=${selectedWorkFlow}`;
    }
    if (selectedStatus.length) {
      deepFilter = `${deepFilter}&status=${JSON.stringify(selectedStatus)}`;
    }
    return deepFilter;
  };
  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes?.workflowReport?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          return finalObject;
        });

        dispatch({ type: 'initialize', data: rows, count: rows?.length || 0 });
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

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const LeftSideContent = () => {
    return (
      <>
        {workFlowOptions && (
          <Autocomplete
            className="min-w-[100px] max-w-[300px] flex-grow"
            options={workFlowOptions}
            getOptionLabel={(option) => option?.workflowName || ''}
            size="small"
            renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Workflow" variant="outlined" />}
            value={
              workFlowOptions.filter((data) => data._id === selectedWorkFlow).length
                ? workFlowOptions.filter((data) => data._id === selectedWorkFlow)[0]
                : ''
            }
            onChange={(event: any, val: any) => {
              setSelectedWorkFlow(val && val._id ? val._id : '');
            }}
          />
        )}
        <Autocomplete
          className="min-w-[100px] max-w-[300px] flex-grow"
          options={[WORK_FLOW_STATUS.open, WORK_FLOW_STATUS.inProgress, WORK_FLOW_STATUS.completed]}
          getOptionLabel={(option) => option || ''}
          size="small"
          multiple={true}
          renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Status" variant="outlined" />}
          value={selectedStatus || []}
          disableCloseOnSelect
          onChange={(event: any, val: any) => {
            setSelectedStatus(val ?? []);
          }}
        />
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.workflowReport, title: resources?.workFlowReport?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          onSearch={handleSearch}
          isActionButtonVisible={false}
          actionButtonProps={{}}
          leftSideContents={<LeftSideContent />}
          addButtonProps={{}}
          isAddButtonVisible={false}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideAction={true}
            hideSelection={true}
            isClientSideGrid={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </section>
  );
};

export default WorkFlowReport;
