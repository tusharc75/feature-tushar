import { DragIndicator } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useContext, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import ArrangeRowDialog from 'src/components/CustomReactTable/ArrangeRow/ArrangeRowDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const ArrangeRow = ({ state, arrangeRowField, resource, refreshGrid }) => {
  const toastConfig = useContext(CustomToastContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSuccess = async (_data) => {
    const { key, materialKey, _id, ...rest } = arrangeRowField;
    setLoading(true);
    await axiosInstance().put(`/dynamic-form/arrange-rows/${_id}`,
      { key, _ids: _data?.map((r) => r?.[materialKey]), ...rest },
      {
        headers: {
          Resource: resource
        }
      }
    ).then(() => {
      refreshGrid();
      setLoading(false);
      setOpen(false);
    }).catch((err) => {
      setLoading(false);
      setOpen(false);
      toastConfig.setToastConfig(err);
    });
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
