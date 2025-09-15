import { Box, Dialog } from '@mui/material';
import { camelCase } from 'lodash';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, displayDateTime, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';

function ReportRunLogs({ scheduleReportData, handleClose }) {

  const renderedFrom = `${camelCase(sidebarResource.scheduleReport)}_ReportRunLogs`;

  const [fullScreen, setFullScreen] = useState(true);
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    fetchColumns();
    fetchData();
  }, []);

  const fetchColumns = () => {
    let columns = [
      {
        accessor: 'date',
        Header: 'Date Time',
        Cell: ({ row }) => (row?.original?.date ? <p className="text-truncate">{displayDateTime(row.original.date)}</p> : <NoDataCell />)
      },
      {
        accessor: 'subject',
        Header: 'Email Subject',
        Cell: ({ row }) =>
          row?.original?.subject ? (
            <div>
              <p className="text-truncate">{row.original.subject}</p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'subscribeUsers',
        Header: 'Subscribe Users',
        Cell: ({ row }) =>
          row?.original?.subscribeUsers?.length ? (
            <div>
              {' '}
              <p className="text-truncate" title={row.original.subscribeUsers}>
                {row.original.subscribeUsers}
              </p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'emails',
        Header: 'Emails',
        Cell: ({ row }) =>
          row?.original?.emails?.length ? (
            <div>
              {' '}
              <p className="text-truncate" title={row.original.emails}>
                {row.original.emails}
              </p>
            </div>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'reportAction',
        Header: 'Report Action',
        Cell: ({ row }) =>
          row?.original?.reportAction ? <p className="text-truncate">{row.original.reportAction}</p> : <p className="text-truncate">{'Email'}</p>
      },
      {
        accessor: 'fileType',
        Header: 'File Type',
        Cell: ({ row }) => (row?.original?.fileType ? <p className="text-truncate">{row.original.fileType}</p> : <NoDataCell />)
      },
      {
        accessor: 'fileName',
        Header: 'File Name',
        Cell: ({ row }) => (row?.original?.fileName ? <p className="text-truncate">{row.original.fileName}</p> : <NoDataCell />)
      },
      {
        accessor: 'comment',
        Header: 'Comment',
        Cell: ({ row }) => (row?.original?.comment ? <p className="text-truncate">{row.original.comment}</p> : <NoDataCell />)
      },
    ];
    setColumns(columns);
  };

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });

    const { data } = await axiosInstance().get(`${routes?.scheduleReport.path}/${scheduleReportData?._id}/logs`);
    let rows = data?.data?.map((u) => {
      let finalObject: any = prepareDataForGrid(u);

      finalObject.subscribeUsers = finalObject?.subscribeUsers?.length
        ? finalObject.subscribeUsers.map((user: any) => `${user?.firstName} ${user?.lastName}`).join(', ')
        : [];
      return finalObject;
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  return (
    <>
      <Dialog
        open
        fullScreen={fullScreen}
        TransitionComponent={CustomDialogTransition}
        maxWidth="md"
        fullWidth
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
      >
        <CustomDialogHeader
          title={`Report Run Logs - ${scheduleReportData?.scheduleName}`}
          onClose={handleClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showRequiredLabel={false}
          showManimizeMaximize={true}
        />
        <CustomDialogContent isFooterPresent={false}>
          {columns ? (
            <Box zIndex={5} width={'100%'} height={'calc(100vh - 200px)'}>
              <CustomReactTable
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                refreshGrid={fetchData}
                hideSelection={true}
                renderedFrom={renderedFrom}
                isClientSideGrid={true}
              />
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </CustomDialogContent>
      </Dialog>
    </>
  );
}

export default ReportRunLogs;
