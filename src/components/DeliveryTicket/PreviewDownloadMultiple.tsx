import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { sidebarResource } from 'src/constants/helpers';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { PreviewDialog } from 'src/components/PreviewDownload/PreviewDialog';

function PreviewDownloadMultiple({ referenceIds }) {
  const toastConfig = useContext(CustomToastContext);

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}&view=true`);

      const cols = data?.map((e: any) => {
        return {
          fieldLabel: e.fieldData.fieldLabel,
          fieldName: e.fieldData.fieldName
        };
      });

      setColumns(cols);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const [showColumnsDialog, setShowColumnsDialog] = useState({ open: false, operation: '' });
  const [loadingType, setLoadingType] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);

  const handleView = (operation, visibleColumns, sortBy = '', orderBy = '') => {
    setLoadingType('Regular');
    setBtnLoading(operation);

    let showColumns = JSON.stringify(
      visibleColumns?.map((e) => {
        return {
          name: e?.fieldName,
          width: e?.width,
          customLabel: e?.customLabel
        };
      })
    );

    let api = `/pdf/multiple?resource=${sidebarResource.deliveryTicket}&columns=${showColumns}&ids=${referenceIds}`;

    if (sortBy && orderBy) {
      api = `${api}&sortBy=${sortBy}&orderBy=${orderBy}`;
    }

    const responseType = 'blob';

    axiosInstance()
      .get(api, { responseType: responseType })
      .then((response) => {
        setLoadingType(null);
        setBtnLoading(null);

        setShowColumnsDialog({ open: false, operation: '' });

        const contentType = 'application/pdf';
        const extension = 'pdf';

        if (operation === 'Preview') {
          const blobData = new Blob([response.data], { type: contentType });
          const fileURL = URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = fileURL;
          link.target = '_blank';
          link.style.display = 'none';
          link.click();
          toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Previewed Successfully.' });
        } else if (operation === 'Download') {
          const blobData = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blobData);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `Delivery-Tickets.${extension}`);
          link.click();
          toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Downloaded Successfully.' });
        }
      })
      .catch((err) => {
        setLoadingType(null);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Box display="flex" justifyContent="space-between">
      <Box display="flex" alignItems="center">
        <div className="flex flex-wrap gap-2">
          <ThemeButton
            mobileTooltip="Preview"
            iconForMobile={<VisibilityIcon />}
            startIcon={<VisibilityIcon />}
            disabled={btnLoading === 'Preview' || referenceIds?.length === 0 || columns?.length === 0}
            onClick={(e) => {
              setShowColumnsDialog({ open: true, operation: 'Preview' });
            }}
          >
            {btnLoading === 'Preview' ? 'Please wait...' : 'Preview'}
          </ThemeButton>
          <ThemeButton
            iconForMobile={<DownloadIcon />}
            mobileTooltip="Download"
            startIcon={<DownloadIcon />}
            disabled={btnLoading === 'Download' || referenceIds?.length === 0 || columns?.length === 0}
            onClick={(e) => {
              setShowColumnsDialog({ open: true, operation: 'Download' });
            }}
          >
            {btnLoading === 'Download' ? 'Please wait...' : 'Download'}
          </ThemeButton>
        </div>
      </Box>
      {showColumnsDialog.open && (
        <PreviewDialog
          type={'PDF'}
          handleClose={() => {
            setShowColumnsDialog({ open: false, operation: '' });
          }}
          handleView={(subType, visibleColumnsPdf, visibleColumnsExcel, sortBy = '', orderBy = '') => {
            handleView(showColumnsDialog.operation, visibleColumnsPdf, sortBy, orderBy);
          }}
          loadingType={loadingType}
          hideDetailButton={true}
          allColumn={columns}
          resource={sidebarResource.deliveryTicket}
          referenceId={null}
          defaultColumns={['assetNumber', 'product', 'productDescription']}
          columns={columns}
          button1Title={'Regular'}
          button2Title={'Detail'}
          operation={showColumnsDialog.operation}
          isExcelDownload={false}
          isAsyncDownload={false}
        />
      )}
    </Box>
  );
}

export default PreviewDownloadMultiple;
