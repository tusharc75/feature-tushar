import { Box, Button, Dialog } from '@material-ui/core';
import moment from 'moment';
import { useEffect } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { CustomDialogTransition, dateFormat, dateTimeFormat } from 'src/constants/helpers';

export default function AssetIotData({ title, data, onClose }) {
  const { state, dispatch } = useTableReducer();

  const columns = [
    {
      accessor: 'date',
      Header: 'Date',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalVolInBBLs'] ? <p className="text-truncate">{moment(row?.original['date']).format(dateFormat)}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'TotalVolInBBLs',
      Header: 'TotalVolInBBLs',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalVolInBBLs'] ? <p className="text-truncate">{row.original.TotalVolInBBLs}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'DailyTotalVolInBBLs',
      Header: 'DailyTotalVolInBBLs',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['DailyTotalVolInBBLs'] ? <p className="text-truncate">{row.original.DailyTotalVolInBBLs}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'TotalVolOutBBLs',
      Header: 'TotalVolOutBBLs',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalVolOutBBLs'] ? <p className="text-truncate">{row.original.TotalVolOutBBLs}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'TotalMinutesFill',
      Header: 'TotalMinutesFill',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalMinutesFill'] ? <p className="text-truncate">{row.original.TotalMinutesFill}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'TotalMinutesPurge',
      Header: 'TotalMinutesPurge',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalMinutesPurge'] ? <p className="text-truncate">{row.original.TotalMinutesPurge}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'TotalMinutesRecycle',
      Header: 'TotalMinutesRecycle',
      disabled: true,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original['TotalMinutesRecycle'] ? <p className="text-truncate">{row.original.TotalMinutesRecycle}</p> : <NoDataCell />;
      }
    }
  ];

  useEffect(() => {
    dispatch({ type: 'initialize', data: data, count: data?.length });
  }, [data?.length]);

  return (
    <Dialog fullScreen={true} TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true}>
      <CustomDialogHeader title={`${title} - Data `} onClose={onClose} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent>
        {columns ? (
          <Box zIndex={5} p={1}>
            <CustomReactTable
              height={'calc(100vh - 250px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={() => {}}
              renderedFrom={'assetIotSata'}
              isClientSideGrid={true}
              hideAction={true}
              hideSelection={true}
              hideExportTable={true}
            />
          </Box>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button
          type="button"
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => {
            onClose();
          }}
        >
          Close
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}
