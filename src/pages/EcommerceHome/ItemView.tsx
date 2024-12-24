import { Box, Grid, IconButton, Paper, Typography } from '@mui/material';
import { Delete, DragIndicator, Edit } from '@mui/icons-material';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfigureItemDialog from './ConfigureItemDialog';

const ItemView = ({ itemData, label, handleRemove, id, dragHandleProps, setFormData }) => {
  const [editDialog, setEditDialog] = useState(false);

  return (
    <Grid item xs={6} sm={itemData?.column} md={itemData?.column}>
      <Paper>
        <Box p={2}>
          <div className="flex items-center gap-2">
            <IconButton size="small" {...dragHandleProps}>
              <DragIndicator />
            </IconButton>
            <Typography variant="body1" style={{ fontWeight: 500 }} className="text-truncate">
              {label}
            </Typography>
          </div>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <HtmlTooltip title="Edit">
              <IconButton
                onClick={() => {
                  setEditDialog(true);
                }}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
                size="small"
              >
                <Edit color="primary" />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Delete">
              <IconButton onClick={() => handleRemove(id)} style={{ display: 'flex', justifyContent: 'flex-end' }} size="small">
                <Delete color="error" />
              </IconButton>
            </HtmlTooltip>
          </Box>
        </Box>
      </Paper>
      {editDialog && (
        <ConfigureItemDialog
          open={editDialog}
          onClose={() => {
            setEditDialog(false);
          }}
          itemData={itemData}
          setFormData={setFormData}
        />
      )}
    </Grid>
  );
};

export default ItemView;
