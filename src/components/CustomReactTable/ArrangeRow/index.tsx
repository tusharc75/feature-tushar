import { DragIndicator } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useState } from 'react';
import ArrangeRowDialog from 'src/components/CustomReactTable/ArrangeRow/ArrangeRowDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const ArrangeRow = ({ state, handleArrangeRow }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (_data) => {
    setLoading(true);
    await handleArrangeRow(_data);
    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <HtmlTooltip title="Arrange Rows" placement="top" arrow>
        <IconButton
          aria-describedby="columnSelection"
          size="small"
          color="primary"
          disabled={false}
          className="refresh-arrange-button"
          onClick={(e) => {
            setOpen(true);
          }}
        >
          <DragIndicator />
        </IconButton>
      </HtmlTooltip>
      {open && (
        <ArrangeRowDialog
          state={state}
          handleClose={() => {
            setOpen(false);
          }}
          handleSuccess={handleSuccess}
          loading={loading}
        />
      )}
    </>
  );
};

export default ArrangeRow;
