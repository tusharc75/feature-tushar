import { Box, Dialog, IconButton } from '@mui/material';
import { useContext, useState } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import { CustomDialogTransition, formatAmountWithCurrency, gridLoadingTimeout } from '../../constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useEffect } from 'react';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';

const DOASteps = [
  {
    key: 'New',
    label: 'Product Builder'
  },
  {
    key: 'Price Builder',
    label: 'Price Builder'
  },
  {
    key: 'Quote Builder',
    label: 'Quote Builder'
  },
  {
    key: 'DOA Process',
    label: 'DOA Process'
  },
  {
    key: 'Send To Customer',
    label: 'Send To Customer'
  },
  {
    key: 'End',
    label: 'End'
  }
];

const renderedFrom = 'AllVersionStatus';

export default function AllVersionStatus({
  open,
  onClose,
  quoteId,
  quoteData,
  quotePermissions,
  fetchQuoteData,
  handleChangeVersionFromAllVersion,
  handleCloneQuoteWithVersionFromAllVersion
}) {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const columns = [
    {
      accessor: 'versionNumber',
      Header: 'Version',
      show: true,
      width: 140,
      disabled: true,
      Cell: ({ row }) => (
        <div
          className="link"
          onClick={() => {
            fetchQuoteData(row?.original?.versionNumber);
            handleChangeVersionFromAllVersion(row?.original?.versionNumber);
          }}
        >
          <CustomRenderCell value={row?.original?.versionNumber} />
        </div>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      show: true,
      Cell: ({ row }) => (
        <div
          className="link text-truncate"
          onClick={() => {
            fetchQuoteData(row?.original?.versionNumber);
            handleChangeVersionFromAllVersion(row?.original?.versionNumber);
          }}
        >
          <CustomRenderCell value={row?.original?.status} />
        </div>
      )
    },
    {
      accessor: 'processStatus',
      Header: 'Current Step',
      show: true,
      Cell: ({ row }) => (
        <span
          className="link text-truncate"
          onClick={() => {
            fetchQuoteData(row?.original?.versionNumber);
            handleChangeVersionFromAllVersion(row?.original?.versionNumber);
          }}
        >
          <CustomRenderCell value={row?.original?.processStatus} />
        </span>
      )
    },
    {
      accessor: 'comment',
      Header: 'Comment',
      show: true,
      Cell: ({ row }) =>
        row?.original?.comment ? (
          <div>
            <p>{row?.original?.comment}</p>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'totalcost',
      Header: 'Total Cost',
      show: true,
      Cell: ({ row }) =>
        row?.original?.totalcost ? (
          <div>
            <p>{row?.original?.totalcost}</p>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'totalSalesPrice',
      Header: 'Total Sales Price',
      show: true,
      Cell: ({ row }) =>
        row?.original?.totalSalesPrice ? (
          <div>
            <p>{row?.original?.totalSalesPrice}</p>
          </div>
        ) : (
          <NoDataCell />
        )
    },
    {
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          {quotePermissions?.isCreate ? (
            <HtmlTooltip title="Clone version to quote">
              <IconButton
                size="small"
                aria-label="clone version"
                onClick={() => {
                  handleCloneQuoteWithVersionFromAllVersion(row.original?.versionNumber);
                }}
              >
                <FileCopyIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          ) : (
            <HtmlTooltip className="cursor-stop" title={`You don't have permission to clone`}>
              <IconButton size="small" aria-label="clone version">
                <FileCopyIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          )}
        </>
      )
    }
  ];

  useEffect(() => {
    if (quoteId) {
      getVersionStatus();
    }
  }, [quoteId]);

  const getVersionStatus = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/quote-builder/quote-hierarchy/${quoteId}`)
      .then(({ data: { data } }) => {
        const newData = data.versions.map((d, index) => {
          return {
            ...d,
            id: index + 1,
            comment: d.comment ? d.comment : '',
            totalcost: formatAmountWithCurrency(quoteData?.currency, d.productData.totalCost).fullFormatAmount,
            totalSalesPrice: formatAmountWithCurrency(quoteData?.currency, d.productData.totalSalesPrice).fullFormatAmount,
            processStatus: DOASteps.find((obj) => obj.key === d.processStatus)?.label
          };
        });

        dispatch({ type: 'initialize', data: newData, count: newData.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <Dialog
      maxWidth="md"
      aria-labelledby="customized-dialog-title"
      open={open}
      onClose={onClose}
      TransitionComponent={CustomDialogTransition}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
    >
      <CustomDialogHeader
        title={`All Version Status`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent isFooterPresent={false}>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => {}}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchQuoteData}
            isClientSideGrid={true}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={false}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
    </Dialog>
  );
}
