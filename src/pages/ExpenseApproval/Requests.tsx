import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useState, useEffect, useContext, Fragment } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Typography } from '@mui/material';
import { EXPENSE_STATUS, expenseReport, expenses, getUniqueCurrencies } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import CustomTableWithCard, { CardInterface, ColumnInterface, createBodyColumns } from 'src/components/CustomTableWithCard';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { toUpper } from 'lodash';

const Requests = ({ referenceId, fetchDataMaster, isMobile = false }) => {
  const toastConfig = useContext(CustomToastContext);

  const [loading, setLoading] = useState(false);

  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [accessor, setAccessor] = useState<CardInterface | null>(null);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumn();
    fetchData();
  }, [referenceId]);

  const fetchData = () => {
    setRowsData(null);
    axiosInstance()
      .get(`${expenseReport.api}`)
      .then(({ data: { data } }) => {
        const mappedExpenses = data
          ?.filter((e) => e?._id === referenceId)
          .map((expense) => ({
            reportTitle: expense.reportTitle,
            status: expense.status,
            _id: expense._id,
            fromDate: expense.fromDate,
            toDate: expense.toDate,
            expenses: expense.expenses.map((exp) => ({
              id: exp._id,
              expenseNumber: exp.expenseNumber,
              expenseDate: exp.expenseDate,
              amount: exp.totalAmount || 'N/A',
              status: exp.status,
              currency: exp.currency
            }))
          }));
        setRowsData(mappedExpenses);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleStatusChange = async (status) => {
    if (!rowsData) return;
    try {
      for (let report of rowsData) {
        await axiosInstance().patch(`${expenseReport.api}/status/${report._id}`, { status });
        if (report.expenses && report.expenses.length > 0) {
          for (let expense of report.expenses) {
            await axiosInstance().patch(`${expenses.api}/status/${expense.id}`, { status });
          }
        }
      }
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  }

  const fetchColumn = async () => {
    setAccessor(null);

    const columns: ColumnInterface[] = [
      {
        headerName: 'From :',
        field: 'fromDate',
        cellRenderer: 'dateRenderer'
      },
      {
        headerName: 'To :',
        field: 'toDate',
        cellRenderer: 'dateRenderer'
      }
    ];

    const accessor: CardInterface = {
      name: (row) => (
        <Typography component={'h6'} className="mt-0 line-clamp-2 !leading-[1.5] max-[768px]:!text-[13px]">
          Report Title :{' '}
          <a className="link" href={`${routes.expenseReportDetail.path}/${row?._id}`} title={row['reportTitle']} rel="noreferrer" target="_blank">
            {row['reportTitle']}
          </a>
        </Typography>
      ),

      headerColumns: [
        {
          style: { marginRight: 'auto' },
          render: (row) => toUpper(row['status']),
          component: (row) => (row['status'] === EXPENSE_STATUS.approved ? 'completedChip' : 'pendingChip')
        },
        {
          render: (row) => {
            return (
              <>
                <Box display="flex">
                  <Box display="flex" flexGrow={1}>
                    {row['status'] === EXPENSE_STATUS.awaitingApproval && (
                      <Fragment>
                        <ThemeButton
                          buttonType="themeBorder"
                          style={{ boxShadow: 'unset' }}
                          className="no-shadow"
                          disabled={loading}
                          onClick={() => {handleStatusChange(EXPENSE_STATUS.approved)}}
                        >
                          Approve
                        </ThemeButton>
                        <Box pl={1} />
                        <ThemeButton buttonType="red" disabled={loading} onClick={() => {handleStatusChange(EXPENSE_STATUS.rejected)}}>
                          Reject
                        </ThemeButton>
                        <Box pl={1} />
                      </Fragment>
                    )}
                  </Box>
                </Box>
              </>
            );
          }
        }
      ],
      bodyColumns: [...createBodyColumns({ columns: columns, exclude: [], xs: 6, sm: 4, md: 4, lg: 2 })]
    };
    setAccessor(accessor);
  };

  return (
    <>
      <Box display="flex" justifyContent={'space-between'}>
        <Box pt={2}>
          {rowsData && accessor ? (
            <>
              <Box zIndex={5} width={'100%'} paddingLeft={'7rem'} height={isMobile ? 'calc(100vh - 143px)' : 'calc(100vh - 290px)'}>
                <CustomTableWithCard
                  data={rowsData}
                  accessor={accessor}
                  uniqueKey={(data) => data._id}
                  onSelect={setSelectedRecords}
                  checkBox={false}
                  showSelectAll={false}
                  height={isMobile ? 'calc(100vh - 160px)' : 'calc(100vh - 290px)'}
                />
                <div className="mt-2">
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 700 }} aria-label="spanning table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Expenses</TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rowsData.flatMap((row) =>
                          row.expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{expense.expenseNumber}</TableCell>
                              <TableCell></TableCell>
                              <TableCell align='right'>{getUniqueCurrencies().find((d) => d.currencyCode === expense.currency)?.symbolNative} {expense.amount}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </Box>
            </>
          ) : (
            <Box height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Requests;
