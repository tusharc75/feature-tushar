import { useState, useEffect, useContext, useReducer } from 'react';
import { Box, Button, Dialog, Grid, IconButton } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { CustomDialogTransition, prepareDataForGrid, serializedAsset } from '../../../constants/helpers';
import CustomAgGrid, { intialState, reducer } from '../../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, DateRenderer } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { camelCase } from 'lodash';
import { staticFrameworkRender } from 'src/constants/useColumns';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import { Link } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import styles from '../../Leads/Header.module.scss';
import IssueCertificateDialog from '../../SerializedAssetsCertification/IssueCertificateDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import ManageAttachment from 'src/components/Activity/Attachments/ManageAttachment';

const CertificationHistory = ({ id, canIssueCertificate, supplierAccount }) => {
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  const [openDialog, setOpenDialog] = useState({ open: false, id: null });
  const [openAttachment, setOpenAttachment] = useState({ open: false, attachmentId: null });
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
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

  const columns = [
    { field: 'issueDate', headerName: 'Issue Date', show: true, filter: false, sortable: false, disabled: true, cellRenderer: 'dateRenderer' },
    { field: 'expiryDate', headerName: 'Expiry Date', show: true, filter: false, sortable: false, disabled: true, cellRenderer: 'dateRenderer' },
    { field: 'supplierAccount', headerName: 'Certification Supplier', show: true, cellRenderer: 'supplierAccountRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, filter: false, sortable: false, cellRenderer: 'createdByRenderer' }
  ];

  const ActionsRenderer = (params) => (
    <>
      {params.data.attachmentId && (
        <HtmlTooltip title="View Attachment">
          <IconButton
            size="small"
            aria-label="Issue"
            onClick={() => {
              setOpenAttachment({ open: true, attachmentId: params.data.attachmentId });
            }}
          >
            <AttachFileIcon color="primary" />
          </IconButton>
        </HtmlTooltip>
      )}
    </>
  );

  const SupplierAccountRenderer = (params: { value: any; data: any }) => (
    <>
      {params.value ? (
        <Link className="link" target="_blanck" title={params.value} to={`${routes.supplierAccountDetail.path}/${params.data.supplierAccountId}`}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const frameworkComponents = {
    supplierAccountRenderer: SupplierAccountRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
    actionsRenderer: ActionsRenderer,
    ...staticFrameworkRender
  };

  return (
    <>
      {canIssueCertificate && (
        <Grid item xs={12} sm={12} md={6}>
          <Button
            variant={'contained'}
            color="primary"
            size="small"
            onClick={() => {
              setOpenDialog({ open: true, id: id });
            }}
          >
            Attach Certificate
          </Button>
        </Grid>
      )}
      <Box>
        {columns ? (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            allowAction={true}
            actionWidth={100}
            allowSelection={false}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom={`${camelCase(routes?.serializedAsset.title)}_certificationHistory`}
            refreshGrid={fetchData}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {openDialog?.open && (
        <IssueCertificateDialog
          onClose={() => setOpenDialog({ open: false, id: null })}
          onSuccess={() => {
            setOpenDialog({ open: false, id: null });
            fetchData();
          }}
          assetId={openDialog?.id}
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
