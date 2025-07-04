import { Box, Dialog } from "@mui/material";
import { camelCase, isEmpty } from "lodash";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import NoDataCell from "src/components/Helpers/NoDataCell";
import { CustomDialogTransition, displayDate, displayDateTime, rentalManagement, sidebarResource } from "src/constants/helpers";
import { Link } from 'react-router-dom';
import routes from "src/components/Helpers/Routes";
import CustomReactTable, { useTableReducer } from "src/components/CustomReactTable";
import { useContext, useEffect } from "react";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "src/axios/axiosInstance";

const SubStatusLog = ({ onClose, assets, title, rentalId }) => {

  const renderedFrom = `${camelCase(sidebarResource.serializedAsset)}_subStatus_logs`;
  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });

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
                <h5 className="text-truncate">{displayDate(row.original?.startDate)}</h5>
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
                <h5 className="text-truncate">{displayDate(row.original?.endDate)}</h5>
              </>
            ) : (
              <NoDataCell />
            )}
          </>
        );
      }
    },
    {
      accessor: 'status',
      Header: 'Status',
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.status ? (
              <div>
                <p className="text-truncate">{row.original?.status}</p>
              </div>
            ) : (
              <NoDataCell />
            )}
          </>
        );
      }
    },
    {
      accessor: 'user',
      Header: 'Updated By',
      disabled: true,
      disableFilters: true,
      disableSortBy: true,
      Cell: ({ row }) =>
        !isEmpty(row?.original?.user) ? (
          <div>
            <Link
              className="link text-truncate"
              title={row?.original?.user?.optionLabel}
              to={`${routes.userDetail.path}/${row?.original?.user?.optionValue}`}
              target={'_blank'}
            >
              {row?.original?.user?.optionLabel}
            </Link>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'transDate',
      Header: 'Rransaction date',
      disableFilters: true,
      disableSortBy: true,
      disabled: true,
      Cell: ({ row }) => {
        return (
          <>
            {row?.original?.transDate ? (
              <>
                <h5 className="text-truncate">{displayDateTime(row.original?.transDate)}</h5>
              </>
            ) : (
              <NoDataCell />
            )}
          </>
        );
      }
    },
  ];

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${rentalManagement.api}/${rentalId}/inventory/logs?assets=${JSON.stringify(assets)}`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'initialize', data: data, count: data?.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

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
      <CustomDialogHeader title={`Logs - ${title}`} onClose={onClose} showRequiredLabel={false} />
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
  )
}

export default SubStatusLog;
