import { useContext, useEffect } from 'react';
import { Dialog, Box } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { CustomDialogTransition, displayDateTime, fieldTicket } from 'src/constants/helpers';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { camelCase, isEmpty } from 'lodash';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';

const StartStopLogsDialog = ({ onClose, referenceId, rowId }) => {
  const renderedFrom = `${camelCase(routes?.fieldTicket.title)}_start_stop_logs`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

  useEffect(() => {
    fetchData();
  }, [rowId, referenceId]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${fieldTicket.api}/technician/start-stop-logs?referenceId=${referenceId}&rowId=${rowId}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const columns: any = [
    {
      accessor: 'startDate',
      Header: 'Start Date',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.startDate ? (
              <>
                <h5 className="text-truncate">{displayDateTime(row.original?.startDate)}</h5>
              </>
            ) : (
              <NoDataCell />
            )}
          </>
        );
      }
    },
    {
      accessor: 'endDate',
      Header: 'End Date',
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.endDate ? (
              <>
                <h5 className="text-truncate">{displayDateTime(row.original?.endDate)}</h5>
              </>
            ) : (
              <NoDataCell />
            )}
          </>
        );
      }
    },
    {
      accessor: 'startedBy',
      Header: 'Started By',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.startedBy) ? (
          <Link
            className="link text-truncate"
            title={row?.original?.startedBy?.optionLabel}
            to={`${routes.userDetail.path}/${row?.original?.startedBy?.optionValue}`}
            target={'_blank'}
          >
            {row?.original?.startedBy?.optionLabel}
          </Link>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'endedBy',
      Header: 'Ended By',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.endedBy) ? (
          <Link
            className="link text-truncate"
            title={row?.original?.endedBy?.optionLabel}
            to={`${routes.userDetail.path}/${row?.original?.endedBy?.optionValue}`}
            target={'_blank'}
          >
            {row?.original?.endedBy?.optionLabel}
          </Link>
        ) : (
          <NoDataCell />
        )
    }
  ];

  return (
    <Dialog
      open={true}
      TransitionComponent={CustomDialogTransition}
      fullScreen={true}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <CustomDialogHeader title={`Logs`} onClose={onClose} showRequiredLabel={false} />
      <CustomDialogContent>
        {columns ? (
          <CustomReactTable
            height={'calc(120vh - 393px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideSelection={true}
            hideAction={true}
            hideExportTable={true}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
};

export default StartStopLogsDialog;
