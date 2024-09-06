import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { Button, Dialog, Grid, Box, IconButton } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomButton from 'src/components/Helpers/CustomButton';
import routes from 'src/components/Helpers/Routes';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import { FiExternalLink } from 'react-icons/fi';
import { CustomDialogTransition } from 'src/constants/helpers';

const DispatchMaterial = ({ handleClose, data, handleSubmit }) => {
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    fetchData();
  }, [data]);

  const columns: any = [
    {
      accessor: 'type',
      Header: 'Type',
      width: 150,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => {
        return row.original['type'] ? <p className="text-truncate">{row.original.type}</p> : <NoDataCell />;
      }
    },
    {
      accessor: 'detail',
      Header: 'Detail',
      minWidth: 300,
      width: 300,
      disabled: true,
      sticky: isMobile || isTablet ? 'none' : 'left',
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original?.detail}
          <IconButton
            size="small"
            style={{ marginLeft: '10px' }}
            onClick={() => {
              window.open(`${routes.productDetail.path}/${row.original?.productId}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      )
    },
    {
      accessor: 'qty',
      Header: 'Qty',
      width: 200,
      Cell: ({ row }) => {
        return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
      }
    }
  ];

  const fetchData = () => {
    if (data?.length) {
      dispatch({ type: 'loading', loading: true });
      dispatch({ type: 'selection', selectedRecords: [] });

      const rows: any = [];
      data[0].material?.forEach((e) => {
        const obj: any = {};
        obj._id = e._id;
        obj.detail = e?.productDetail?.productName;
        obj.productId = e?.productDetail?._id;
        obj.type = 'Product';
        obj.qty = e?.qty;
        rows.push(obj);
      });

      dispatch({ type: 'initialize', data: rows, count: rows?.length });
      dispatch({ type: 'loading', loading: false });
    }
  };

  return (
    <Dialog
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen || isMobile || isTablet}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      <CustomDialogHeader
        title={'Dispatch'}
        showRequiredLabel={false}
        onClose={handleClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      ></CustomDialogHeader>
      <CustomDialogContent>
        {columns && (
          <CustomReactTable
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchData}
            hideAction={true}
            renderedFrom={`product_dispatch_technician`}
            isClientSideGrid={true}
          />
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" color="primary" onClick={handleClose}>
          {'Cancel'}
        </Button>
        <CustomButton
          loading={false}
          variant="contained"
          color="primary"
          type="submit"
          onClick={() => {
            handleSubmit([
              {
                ...data[0],
                material: selectedRecords?.map((e) => {
                  return { _id: e._id, type: 'product', product: e.productId, qty: e?.qty };
                })
              }
            ]);
          }}
        >
          {' '}
          Dispatch
        </CustomButton>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default DispatchMaterial;
