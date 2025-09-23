import { useState, useEffect, useContext } from 'react';
import { Box, Dialog, IconButton, MenuItem } from '@mui/material';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CHILD_RESOURCE, CustomDialogTransition, displayDate, prepareDataForGrid, serializedAsset, serializedAssetsCertification, sidebarResource } from '../../../constants/helpers';
import { camelCase, isArray } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { isMobile, isTablet } from 'react-device-detect';
import IssueCertificateDialog from '../../SerializedAssetsCertification/IssueCertificateDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';
import { useData } from 'src/StateProvider/Provider';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import ShowAttachemntsDialog from 'src/pages/FieldTicket/Submit/ShowAttachemntsDialog';

const renderedFrom = `${camelCase(sidebarResource?.serializedAsset)}_certificationHistory`;

const CertificationHistory = ({ id, canIssueCertificate, supplierAccount, assetDetails = null, fetchAssetData = null }) => {
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [columns, setColumns] = useState(null);
  const [openDialog, setOpenDialog] = useState({ open: false });
  const [openAttachment, setOpenAttachment] = useState({ open: false, attachments: null });
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });
  const [isDeleting, setIsDeleting] = useState(false);

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
        let newColumns = generateColumns(renderedFrom, data?.filter((o) => o.fieldName !== 'attachments'), routes.serializedAssetDetail.path, true);
        newColumns.push({
          accessor: 'createdBy',
          Header: 'Created By',
          disableFilters: true,
          disableSortBy: false,
          Cell: ({ row }) =>
            row.original?.createdBy ? (
              <h5 className="createBy" title={`${row.original?.createdBy} • ${displayDate(row.original?.createdByDate)}`}>
                {row.original?.createdBy}
                <span className="hidden">&nbsp;-&nbsp;</span>
                <span className="createdAtTime badge-date">{displayDate(row.original?.createdByDate)}</span>
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
        {row.original?.attachments && isArray(row.original?.attachments) && row.original?.attachments?.length > 0 && (
          <HtmlTooltip title="View Attachment">
            <IconButton
              size="small"
              aria-label="Issue"
              onClick={() => {
                setOpenAttachment({ open: true, attachments: row.original?.attachments });
              }}
            >
              <AttachFileIcon fontSize='small' color="primary" />
            </IconButton>
          </HtmlTooltip>
        )}
        {!!row?.original?.canDelete && canIssueCertificate && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              onClick={() => {
                setShowConfirmBox({ open: true, _id: row?.original?._id });
              }}
            >
              <DeleteIcon fontSize='small' color="error" />
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

  const handleRemove = () => {
    setIsDeleting(true);
    axiosInstance()
      .put(`${serializedAssetsCertification.api}/remove`, {
        _id: showConfirmBox?._id
      })
      .then(() => {
        setIsDeleting(false);
        setShowConfirmBox({ open: false, _id: null });
        fetchData();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDeleting(false);
      });
  }

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
        <ShowAttachemntsDialog
          onClose={() => {
            setOpenAttachment({ open: false, attachments: null })
          }}
          attachments={openAttachment.attachments}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialogRaw
          open={true}
          message={`Are you sure you want to delete this certificate ?`}
          okBtnLoading={isDeleting}
          onClose={() => {
            setShowConfirmBox({ open: false, _id: null });
          }}
          onOk={handleRemove}
        />
      )}
    </>
  );
};

export default CertificationHistory;
