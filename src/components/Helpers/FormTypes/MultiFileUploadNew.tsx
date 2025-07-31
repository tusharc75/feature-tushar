import React, { Fragment, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { isArray } from 'lodash';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import HtmlTooltip from '../../CustomTooltipTitle';
import { ThemeButton } from '../Buttons';
import Grid from '@mui/material/Grid2';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DocumentScannerNew from 'src/components/Activity/Helpers/DocumentScannerNew';

interface FileItem {
  name: string;
}

interface Props {
  name: string;
  label?: string;
  tooltipMessage?: string;
  isTooltip?: boolean;
  handleSelectFile: (e: any) => void;
  values: Record<string, FileItem[]>;
  errors: Record<string, any>;
  touched: Record<string, boolean>;
  accept?: string;
  required?: boolean;
  setFieldValue: (field: string, value: any) => void;
  disabled?: boolean;
}

const MultiFileUploadNew: React.FC<Props> = ({
  name,
  label = '',
  tooltipMessage = '',
  isTooltip = false,
  handleSelectFile,
  values,
  errors,
  touched,
  accept,
  required = false,
  setFieldValue,
  disabled = false,
}) => {
  const [documentScanDialog, setDocumentScanDialog] = useState(false);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>, handleSelectFile: (event: any) => void) => {
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
    <Fragment>
      <Box display="flex" alignItems="center" pb={(isTooltip && Boolean(tooltipMessage)) || label !== '' ? 0 : 0}>
        <Typography color="textSecondary">{label}</Typography>
        {isTooltip && Boolean(tooltipMessage) && (
          <>
            <IconButton size="small">
              <HtmlTooltip title={tooltipMessage}>
                <InfoIcon color="disabled" />
              </HtmlTooltip>
            </IconButton>
            <Box mr={2} />
          </>
        )}
      </Box>
      <Grid size={{ xs: 12, sm: 12, md: 12 }}>
        <Box
          className={`mt-2 p-3 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 outline-none text-center flex flex-col items-center justify-center focus:border-cyan-600`}
          onDrop={(e) => {
            e.preventDefault();
            if (!disabled) {
              handleSelectFile({ target: { files: e.dataTransfer.files } });
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onPaste={(e) => handlePaste(e, handleSelectFile)}
          tabIndex={0}
        >
          <input
            disabled={disabled}
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
            <Grid container spacing={2} marginTop={2}>
              <label htmlFor={name}>
                <ThemeButton
                  component="span"
                  disabled={disabled}
                  buttonType="theme"
                  startIcon={<BackupOutlinedIcon className='m-0.5' />}
                >
                  {required ? ' Select Files *' : ' Select Files'}
                </ThemeButton>
              </label>
              <ThemeButton
                buttonType="theme"
                component="span"
                disabled={disabled}
                onClick={() => setDocumentScanDialog(true)}
                startIcon={<DescriptionOutlinedIcon className='m-0.5' />}>
                Scan Document
              </ThemeButton>
            </Grid>
          </>
          {touched[name] && Boolean(errors[name]) && (
            <Box pt={1}>
              <Typography variant="body2" className="text-truncate" color="error">
                {errors[name]}
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
      {values[name] && isArray(values[name]) && values[name].length > 0 && (
        <Box mt={2}>
          {values[name].map((item, i) => (
            <Box key={`${item.name}-${i}`} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
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
            </Box>
          ))}
        </Box>
      )
      }
      {documentScanDialog && (
        <DocumentScannerNew
          name={name}
          open={setDocumentScanDialog}
          onClose={() => setDocumentScanDialog(false)}
          values={values}
          setFieldValue={setFieldValue}
        />
      )}
    </Fragment >
  );
};

export default MultiFileUploadNew;
