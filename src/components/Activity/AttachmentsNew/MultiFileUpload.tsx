import React, { Fragment, useContext, useState } from 'react';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { IconButton, Typography } from '@mui/material';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { documentUploadMaxSize } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { isArray } from 'lodash';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import DocumentScannerNew from 'src/components/Activity/Helpers/DocumentScannerNew';

const MultiFileUpload = ({ name, required = false, accept = '', values, setFieldValue, errors, touched, fileUploadMaxSize = { ...documentUploadMaxSize }, }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [documentScanDialog, setDocumentScanDialog] = useState(false);

  const handleSelectFile = (ev) => {
    if (ev.target.files && ev.target.files.length) {
      const selectedFiles = ev.target.files;

      const files = Array.isArray(values[name]) ? [...values[name]] : [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.size > fileUploadMaxSize.size) {
          setToastConfig({
            open: true,
            type: 'error',
            message: `file must be less than ${fileUploadMaxSize.text} size`
          });
          break;
        }
        files.push(file)
      }
      setFieldValue(name, files);
      ev.target.value = '';
    }
  }

  const handlePaste = (e, handleSelectFile) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    const fileItems: File[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) fileItems.push(file);
      }
    }

    if (fileItems.length) {
      const dt = new DataTransfer();
      fileItems.forEach((f) => dt.items.add(f));
      handleSelectFile({ target: { files: dt.files } });
    } else {
      console.warn('No file found in clipboard');
    }
  };

  return (
    <div className='mt-5 mb-5'>
      <div className={`mt-2 p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 outline-none text-center flex flex-col items-center justify-center focus:border-cyan-600`}
        onDrop={(e) => {
          e.preventDefault();
          handleSelectFile({ target: { files: e.dataTransfer.files } });
        }}
        onDragOver={(e) => e.preventDefault()}
        onPaste={(e) => handlePaste(e, handleSelectFile)}
        tabIndex={0}
      >
        <input
          id={name}
          name={name}
          onChange={(e) => handleSelectFile(e)}
          style={{ display: 'none' }}
          onClick={(e: any) => (e.target.value = null)}
          type="file"
          accept={accept}
          multiple
        />
        <>
          <BackupOutlinedIcon color="action" fontSize='large' />
          <Typography variant="body2" color="#555555" mt={1} fontWeight={500} >
            Drag and drop files here or press (Ctrl/⌘ + V)
          </Typography>
          <div className='flex gap-4 mt-4'>
            <label htmlFor={name}>
              <ThemeButton
                component="span"
                buttonType="theme"
                startIcon={<BackupOutlinedIcon className='m-0.5' />}
              >
                {required ? ' Select Files *' : ' Select Files'}
              </ThemeButton>
            </label>
            <ThemeButton
              buttonType="theme"
              component="span"
              onClick={() => setDocumentScanDialog(true)}
              startIcon={<DescriptionOutlinedIcon className='m-0.5' />}>
              Scan Document
            </ThemeButton>
          </div>
        </>
      </div>
      {touched[name] && Boolean(errors[name]) && (
        <div className='mt-1'>
          <Typography variant="body2" className="text-truncate" color="error">
            {errors[name]}
          </Typography>
        </div>
      )}

      {values[name] && isArray(values[name]) && values[name].length > 0 && (
        <div className='mt-4'>
          {values[name].map((item, i) => (
            <div key={`${item.name}-${i}`} className='flex items-center justify-between'>
              <Typography variant="body2" className="text-truncate" color="textPrimary" sx={{ maxWidth: '80%' }}>
                {item?.name}
              </Typography>
              <HtmlTooltip title="Remove">
                <IconButton
                  size="small"
                  disabled={!values[name]}
                  onClick={() =>
                    setFieldValue(name, values[name].filter((d) => d.name !== item.name))
                  }
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </HtmlTooltip>
            </div>
          ))}
        </div>
      )}

      {documentScanDialog && (
        <DocumentScannerNew
          name={name}
          open={setDocumentScanDialog}
          onClose={() => setDocumentScanDialog(false)}
          values={values}
          setFieldValue={setFieldValue}
        />
      )}
    </div>
  );
};

export default MultiFileUpload;
