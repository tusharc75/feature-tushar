
import { Avatar, Box, IconButton, TextField } from '@mui/material';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import GenerativeAiDialog from 'src/components/GenerativeAiDialog';
import { useState } from 'react';

function MultiLine({ value, label, required = false, onChange, name = '', rest = {}, error = false, touched = '', type = 'text' }) {

  const [generativeAiDialogOpen, setGenerativeAiDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...rest}
        variant="outlined"
        type={type}
        multiline
        label={label}
        fullWidth
        name={name}
        required={required}
        rows={3}
        value={value}
        error={error}
        helperText={touched}
        onChange={(e) => {
          onChange(e.target.value.trimStart())
        }}
        sx={{
          '& .MuiInputBase-root textarea': {
            resize: 'vertical',
            overflow: 'auto',
          },
        }}
      />
      <IconButton
        size="small"
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 1,
        }}
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
          setGenerativeAiDialogOpen(true)
        }}
      >
        <Avatar src={genieImage} sx={{ width: 25, height: 25 }} />
      </IconButton>
      {generativeAiDialogOpen &&
        <GenerativeAiDialog
          existingContent={value}
          handleInsert={(content) => {
            onChange(content.trimStart())
            setAnchorEl(null);
            setGenerativeAiDialogOpen(false)
          }}
          handleClose={() => {
            setAnchorEl(null);
            setGenerativeAiDialogOpen(false)
          }}
          anchorEl={anchorEl}
        />
      }
    </Box >
  );
}

export default MultiLine;
