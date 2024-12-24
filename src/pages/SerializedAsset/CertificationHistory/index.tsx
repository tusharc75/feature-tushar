import { useState, useEffect, useContext } from 'react';
import { Box, Button, Dialog, Grid, IconButton, MenuItem } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CHILD_RESOURCE, CustomDialogTransition, dateFormat, prepareDataForGrid, serializedAsset, sidebarResource } from '../../../constants/helpers';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import IssueCertificateDialog from '../../SerializedAssetsCertification/IssueCertificateDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import { useData } from 'src/StateProvider/Provider';
import moment from 'moment';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';

const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_certificationHistory`;

const CertificationHistory = ({ id, canIssueCertificate, supplierAccount, assetDetails = null, fetchAssetData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const [openDialog, setOpenDialog] = useState({ open: false });
  const [openAttachment, setOpenAttachment] = useState({ open: false, attachmentId: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const { generateColumns } = useColumns();

  const {
    state: { permissions }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    var api = `${serializedAsset.api}/${id}/certificate`;
    if (supplierAccount) {
      api = api + `?supplierAccount=${supplierAccount}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject.attachmentId = u?.attachmentId;
          return {
            ...finalObject
          };
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.serializedAssetsCertification}`)
      .then(({ data: { data } }) => {
        let newColumns = generateColumns(
          renderedFrom,
          data?.filter((o) => o.fieldName !== 'attachments'),
          routes.serializedAssetDetail.path,
          true
        );
        newColumns.push({
          accessor: 'supplierAccount',
          Header: 'Certification Supplier',
          Cell: ({ row }) => (
            <div>
              {row.original?.supplierAccount ? (
                permissions?.supplierAccount?.isRead ? (
                  <Link
                    className="link"
                    target="_blank"
                    title={row.original?.supplierAccount}
                    to={`${routes.supplierAccountDetail.path}/${row.original?.supplierAccountId}`}
                  >
                    {row.original?.supplierAccount}
                  </Link>
                ) : (
                  <span>{row.original?.supplierAccount}</span>
                )
              ) : (
                <NoDataCell />
              )}
            </div>
          )
        });
        newColumns.push({
          accessor: 'createdBy',
          Header: 'Created By',
          disableFilters: true,
          disableSortBy: false,
          Cell: ({ row }) =>
            row.original?.createdBy ? (
              <h5 className="createBy" title={`${row.original?.createdBy} • ${moment(row.original?.createdByDate).format(dateFormat)}`}>
                {row.original?.createdBy}
                <span className="hidden">&nbsp;-&nbsp;</span>
                <span className="createdAtTime badge-date">{moment(row.original?.createdByDate)?.format(dateFormat)}</span>
              </h5>
            ) : (
              <NoDataCell />
            )
        });
        newColumns?.forEach((e) => {
          if (['issueDate', 'expiryDate', 'owner'].includes(e.accessor)) {
            e.disabled = true;
          }
        });
        setColumns([...newColumns, ActionsRenderer]);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {row.original?.attachmentId && (
          <HtmlTooltip title="View Attachment">
            <IconButton
              size="small"
              aria-label="Issue"
              onClick={() => {
                setOpenAttachment({ open: true, attachmentId: row.original?.attachmentId });
              }}
            >
              <AttachFileIcon color="primary" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };
  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem
          onClick={() => {
            setOpenDialog({ open: true });
          }}
        >
          Attach Certificate
        </MenuItem>
      </>
    );
  };

  return (
    <>
      {canIssueCertificate && (
        <DetailsPageHeader isActionButtonVisible={false} isAddButtonVisible={true} addButtonMenuItems={addButtonMenuItems()} hasXpadding={false} />
      )}
      <Box>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 250px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            refreshGrid={fetchData}
            showFilters={false}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {openDialog?.open && (
        <IssueCertificateDialog
          onClose={() => setOpenDialog({ open: false })}
          onSuccess={() => {
            setOpenDialog({ open: false });
            fetchData();
            if (fetchAssetData) {
              fetchAssetData();
            }
          }}
          assetId={id}
          certificateExpiryDate={assetDetails?.certificateExpiryDate || null}
        />
      )}
      {openAttachment.open && (
        <Dialog
          open={true}
          aria-labelledby="customized-dialog-title"
          maxWidth="md"
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              setFullScreen(false);
              setOpenAttachment({ open: false, attachmentId: null });
            }
          }}
          fullWidth
          fullScreen={fullScreen || isMobile || isTablet}
          TransitionComponent={CustomDialogTransition}
        >
          <ManageAttachment
            attachmentId={openAttachment.attachmentId?._id}
            handleClose={() => {
              setFullScreen(false);
              setOpenAttachment({ open: false, attachmentId: null });
            }}
            relatedTo={openAttachment.attachmentId?.relatedTo}
            isMinimized={!fullScreen}
            onMinimizeMaximize={() => {
              setFullScreen((prevState) => !prevState);
            }}
            showManimizeMaximize={true}
            parentFolder={openAttachment.attachmentId?.parentFolder}
            type={openAttachment.attachmentId?.type}
          />
        </Dialog>
      )}
    </>
  );
};

export default CertificationHistory;
