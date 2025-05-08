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
    const { keys, _id, ...rest } = arrangeRowField;
    const data: any = [];
    keys?.forEach((ele) => {
      data.push({
        key: ele?.key,
        materialKey: ele?.materialKey,
        data: _data
          ?.filter((d) => ele?.filterType?.includes(d?.type))
          ?.map((d) => ({ _id: d?.[ele?.materialKey], order: _data?.findIndex((_d) => _d?.[ele?.materialKey] === d?.[ele?.materialKey]) }))
      });
    });

    setLoading(true);
    await axiosInstance()
      .put(
        `/dynamic-form/arrange-rows/${_id}`,
        { data, ...rest },
        {
          headers: {
            Resource: resource
          }
        }
      )
      .then(() => {
        refreshGrid();
        setLoading(false);
        setOpen(false);
      })
      .catch((err) => {
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
