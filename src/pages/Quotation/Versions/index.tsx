import { Box, Dialog, IconButton } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomDialogTransition, gridLoadingTimeout, sidebarResource } from '../../../constants/helpers';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomRenderCell from '../../../components/Helpers/CustomRenderCell';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { isMobile, isTablet } from 'react-device-detect';
import { camelCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ManageQuotationDialog from '../ManageQuotationDialog';
import { useData } from '../../../StateProvider/Provider';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { cloneDisable } from 'src/constants/messageHelpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { FiExternalLink } from 'react-icons/fi';
import InfoIcon from '@mui/icons-material/Info';

export default function Version({ onClose, quotationId, handleChangeVersion, referenceType = '' }) {
  const renderedFrom = `${camelCase(sidebarResource?.quotation)}_versions`;
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const {
    state: { permissions, resources }
  }: any = useData();

  const toastConfig = useContext(CustomToastContext);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showManageQuotationDialog, setShowManageQuotationDialog] = useState({ open: false, isClone: false, idToClone: null, versionId: null });

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = () => {
    let columns = [];
    columns.push({
      accessor: 'version',
      Header: 'Version',
      width: 200,
      primaryField: true,
      disabled: true,
      Cell: ({ row }) => {
        return row.original?.version ? (
          <div className="flex items-center gap-2">
            {referenceType === 'rentalJob' || referenceType === 'repairOrder' ? (
              <p className="text-truncate">{row?.original?.version}</p>
            ) : (
              <Link
                className="link text-truncate"
                onClick={() => {
                  handleChangeVersion(row?.original?.version);
                }}
              >
                <CustomRenderCell value={row?.original?.version} />
              </Link>
            )}
            {row.original?.converted && (
              <HtmlTooltip title="Converted">
                <InfoIcon fontSize="small" color={'primary'} />
              </HtmlTooltip>
            )}
          </div>
        ) : (
          <NoDataCell />
        );
      }
    });
    if (referenceType === 'rentalJob' || referenceType === 'repairOrder') {
      columns.push({
        accessor: 'quotationNumber',
        Header: 'Quotation Number',
        width: 200,
        Cell: ({ row }) => {
          return row?.original?.quotationNumber ? (
            <div className="flex items-center gap-1">
              <p> {row?.original?.quotationNumber}</p>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.quotationDetail.path}/${row?.original?.quotationId}`);
                }}
              >
                <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
              </IconButton>
            </div>
          ) : (
            <NoDataCell />
          );
        }
      });
    }
    columns.push({
      accessor: 'status',
      Header: 'Status',
      width: 200,
      Cell: ({ row }) => {
        return row.original?.status ? <p className="text-truncate">{row.original.status}</p> : <NoDataCell />;
      }
    });
    columns.push({
      accessor: 'comment',
      Header: 'Comment',
      width: 300,
      Cell: ({ row }) => {
        return row.original?.comment ? <p className="text-truncate">{row.original.comment}</p> : <NoDataCell />;
      }
    });
    columns = [...columns, ActionsRenderer];
    setColumns(columns);
  };

  useEffect(() => {
    if (quotationId) {
      fetchData();
    }
  }, [quotationId]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.quotation?.isCreate ? `Clone Version to ${resources?.quotation?.titleSingular}` : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageQuotationDialog({
                  open: true,
                  isClone: true,
                  idToClone: row?.original?.quotationId,
                  versionId: row?.original?._id
                });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.quotation?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/quotation/${quotationId}`)
      .then(({ data: { data } }) => {
        const newData: any = Object.entries(data?.versions)?.map(([key, value]) => {
          return {
            ...data?.versions[key],
            quotationNumber: data?.quotationNumber,
            quotationId: data?._id,
            id: key
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
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open
      onClose={onClose}
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
        showRequiredLabel={false}
      />
      <CustomDialogContent isFooterPresent={false}>
        {columns ? (
          <CustomReactTable
            height={fullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            isClientSideGrid={true}
            hideSelection={true}
          />
        ) : (
          <Box height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      {showManageQuotationDialog.open && (
        <ManageQuotationDialog
          isClone={showManageQuotationDialog.isClone}
          open={showManageQuotationDialog.open}
          quotationId={showManageQuotationDialog.idToClone}
          onClose={() => setShowManageQuotationDialog({ open: false, isClone: false, idToClone: null, versionId: null })}
          onSuccess={() => {
            setShowManageQuotationDialog({ open: false, isClone: false, idToClone: null, versionId: null });
            onClose();
          }}
          versionId={showManageQuotationDialog.versionId}
        />
      )}
    </Dialog>
  );
}
