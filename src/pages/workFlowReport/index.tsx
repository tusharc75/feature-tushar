import { Box, TextField } from '@material-ui/core';
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
import { gridLoadingTimeout, prepareDataForGrid } from 'src/constants/helpers';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';
import { useHistory } from 'react-router-dom';
import { Autocomplete } from '@material-ui/lab';
import { WORK_FLOW_STATUS } from 'src/constants/helpers';

const renderedFrom = camelCase(routes?.workflowReport.title);

const WorkFlowReport = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { user, permissions }
  }: any = useData();

  const [columns, setColumns] = useState(null);
  const [workFlowOptions, setWorkFlowOptions] = useState(null);
  const [selectedWorkFlow, setSelectedWorkFlow] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

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
          <div>
            <Link className="link" to={`${routes.workflowReportDetail.path}/${row?.original?._id}`}>
              {row?.original?.workflowNumber}
            </Link>
          </div>
        )
      },
      {
        accessor: 'reference',
        Header: 'Reference',
        width: 150,
        Cell: ({ row }) => (
          <div>
            <Link
              className="link"
              to={`${routes[`${camelCase(row?.original?.resource)}`]?.path || kebabCase(row?.original?.resource)}/detail/${row?.original?.referenceId}`}
              target={'_blank'}
            >
              {row?.original?.reference}
            </Link>
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
          <div>
            <Link className="link" to={`${routes.workflow.path}/${row?.original?.workflowId}`} target={'_blank'}>
              {row?.original?.workflow}
            </Link>
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
    if (selectedStatus) {
      deepFilter = `${deepFilter}&status=${selectedStatus}`;
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
          renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Status" variant="outlined" />}
          value={selectedStatus || ''}
          onChange={(event: any, val: any) => {
            setSelectedStatus(val ?? '');
          }}
        />
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.workflowReport]} />
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
