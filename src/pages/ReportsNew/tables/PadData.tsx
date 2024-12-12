import { Box, Dialog, Grid } from '@material-ui/core';
import { isNumber } from 'lodash';
import { useEffect, useState } from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, formatAmountWithCurrency } from 'src/constants/helpers';

const renderedFrom = 'historical-report_pad_data';

const PadData = ({ handleClose, column, data }) => {
  const { state, dispatch } = useTableReducer({ renderedFrom });

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    fetchColumns();
    fetchRecords();
  }, [data]);

  const fetchColumns = () => {
    const newColumn = [
      {
        accessor: 'padName',
        Header: 'Pad Name',
        width: 200,
        Cell: ({ row }) => (
          <div>
            {row?.original?.padName?.optionLabel ? (
              <p
                className="link text-truncate"
                onClick={() => {
                  window.open(`${routes.padMasterDetail.path}/${row?.original?.padName?.optionValue}`);
                }}
              >
                {row?.original?.padName?.optionLabel}
              </p>
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      {
        accessor: 'customerAccount',
        Header: 'Customer Account',
        width: 200,
        Cell: ({ row }) => (
          <div>
            {row?.original?.customerAccount?.optionLabel ? (
              <p
                className="link text-truncate"
                onClick={() => {
                  window.open(`${routes.customerAccountDetail.path}/${row?.original?.customerAccount?.optionValue}`);
                }}
              >
                {row?.original?.customerAccount?.optionLabel}
              </p>
            ) : (
              <NoDataCell />
            )}
          </div>
        )
      },
      ...column
    ];
    const footerData = data;
    const dataKeys = Object.keys(footerData);
    const updatedColumn = newColumn?.map((col, index) => {
      if (index === 0) {
        return { ...col, Footer: 'Total' };
      }
      if (dataKeys.includes(col.accessor)) {
        return {
          ...col,
          Footer:
            footerData[col.accessor] && isNumber(footerData[col.accessor]) ? (
              col?.type === 'currencyNumber' ? (
                `${formatAmountWithCurrency(col?.currency, footerData[col.accessor])?.fullFormatAmountWithoutSpace}`
              ) : (
                footerData[col.accessor]
              )
            ) : (
              <NoDataCell />
            )
        };
      }
      return col;
    });
    setColumns(updatedColumn);
  };

  const fetchRecords = () => {
    dispatch({ type: 'initialize', data: [...(data?.padData || [])], count: data?.padData?.length });
  };

  return (
    <Dialog fullScreen TransitionComponent={CustomDialogTransition} aria-labelledby="customized-dialog-title" open={true} fullWidth>
      <CustomDialogHeader title={`Pad Wise Data`} onClose={handleClose} showRequiredLabel={false}></CustomDialogHeader>
      <CustomDialogContent isFooterPresent={false}>
        <Grid item xs={12} md={12} sm={12} className="mt-3">
          {columns ? (
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              showArrangeView={false}
              refreshGrid={fetchRecords}
              hideSelection={true}
              hideAction={true}
              pagination={false}
            />
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </CustomDialogContent>
    </Dialog>
  );
};

export default PadData;
