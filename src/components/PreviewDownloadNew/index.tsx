import { Fragment, useContext, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DownloadIcon, ExportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import { ThemeButton } from '../Helpers/Buttons';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AsyncDownloadDialog } from 'src/components/PreviewDownloadNew/AsyncDownloadDialog';

function PreviewDownloadNew({
  resource,
  referenceId,
  fileName,
  isSendEmail = false,
  hideDetailButton = false,
  button1Title = 'Regular',
  button2Title = 'Detail',
  extraQueryParams = null,
  subject = '',
  isExcelDownload = false,
  versionNumber = null,
  handleRefresh = null,
  toEmails = [],
  ccEmails = [],
  isAsyncDownload = false,
  referenceLabel = '',
  ids = null
}) {
  const toastConfig = useContext(CustomToastContext);

  const [sendEmail, setSendEmail] = useState(false);
  const [emailAttachments, setEmailAttachments] = useState([]);

  const [loadingType, setLoadingType] = useState(null);
  const [btnLoading, setBtnLoading] = useState(null);
  const [openAsynDialog, setOpenAsynDialog] = useState(false);


  const handleView = (type, operation, subType) => {
    setLoadingType(subType);
    setBtnLoading(operation);
    let api = '';
    if (Array.isArray(ids) && ids.length > 0) {
      if (subType === 'Detail') {
        api = `/pdf/multiple/detail?resource=${resource}&ids=${ids}`;
      } else {
        api = `/pdf/multiple?resource=${resource}&ids=${ids}`;
      }
    }
    else {
      if (type === 'Excel') {
        api = `/excel/${referenceId}?resource=${resource}`;
      }
      else {
        if (isAsyncDownload) {
          if (subType === 'Detail') {
            api = `/pdf-new/async-download/${referenceId}/detail?resource=${resource}&referenceLabel=${referenceLabel}`;
          } else {
            api = `/pdf-new/async-download/${referenceId}?resource=${resource}&referenceLabel=${referenceLabel}`;
          }
        } else {
          if (subType === 'Detail') {
            api = `/pdf-new/${referenceId}/detail?resource=${resource}`;
          } else {
            api = `/pdf-new/${referenceId}?resource=${resource}`;
          }
        }
      }
    }
    if (extraQueryParams) {
      for (const key in extraQueryParams) {
        api = `${api}&${key}=${extraQueryParams[key]}`;
      }
    }
    const responseType = type === 'Excel' ? 'arraybuffer' : 'blob';
    axiosInstance()
      .get(api, { responseType: responseType })
      .then((response) => {
        setLoadingType(null);
        setBtnLoading(null);
        if (isAsyncDownload) {
          toastConfig.setToastConfig({
            message: 'Document creation in process',
            open: true,
            type: 'success'
          });
        } else {
          let newFileName = fileName;
          if (subType !== '' && !hideDetailButton) {
            newFileName = `${newFileName}-${subType === 'Regular' ? button1Title : button2Title}`;
          }
          const contentType = type === 'PDF' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          const extension = type === 'PDF' ? 'pdf' : 'xlsx';

          if (type === 'PDF' && operation === 'Preview') {
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
            link.setAttribute('download', `${newFileName}.${extension}`);
            link.click();
            toastConfig.setToastConfig({ open: true, type: 'success', message: 'File Downloaded Successfully.' });
          } else if (operation === 'base64') {
            const blobData = new Blob([response.data], { type: contentType });
            generateBase64forFile(blobData, newFileName, extension);
          }
        }
      })
      .catch((err) => {
        setLoadingType(null);
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, extension) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      const attachments = {
        base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
        contentType: base64data.split(';')[0].split(':')[1],
        extension: `.${extension}`,
        name: fileName
      };
      setEmailAttachments((prevState) => {
        return [...prevState, attachments];
      });
      setSendEmail(true);
    };
  };

  return (
    <Fragment>
      <ThemeButton
        id={'details-page-preview-button'}
        mobileTooltip="Preview"
        iconForMobile={<VisibilityIcon />}
        startIcon={<VisibilityIcon />}
        disabled={btnLoading === 'Preview'}
        onClick={(e) => {
          if (isAsyncDownload) {
            setOpenAsynDialog(true)
          } else {
            setLoadingType('Preview')
            handleView('PDF', 'Preview', 'Regular');
          }
        }}
      >
        Preview
      </ThemeButton>
      <ThemeButton
        iconForMobile={<DownloadIcon />}
        id={'details-page-download-button'}
        mobileTooltip="Download"
        startIcon={<DownloadIcon />}
        disabled={btnLoading === 'Download'}
        onClick={(e) => {
          if (isAsyncDownload) {
            setOpenAsynDialog(true)
          } else {
            setLoadingType('Download')
            handleView('PDF', 'Download', 'Regular');
          }
        }}
      >
        Download
      </ThemeButton>
      {openAsynDialog &&
        <AsyncDownloadDialog
          resource={resource}
          referenceId={referenceId}
          loadingType={loadingType}
          btnLoading={btnLoading}
          handleClose={() => { setOpenAsynDialog(false) }}
          generatePdf={() => {
            handleView('PDF', 'Preview', 'Regular');
          }}
        />
      }
    </Fragment >
  );
}

export default PreviewDownloadNew;
