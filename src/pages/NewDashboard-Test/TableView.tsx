import { TableBody, Table, TableCell, TableContainer, TableHead, TableRow, Box } from '@material-ui/core';
import { startCase } from 'lodash';
import { formatAmountWithCurrency } from '../../constants/helpers';

interface Props {
  id: string;
  chartData: any[];
  isScreenSmall: boolean;
  currency: string;
  type: string;
  selectedDashboard: string;
}

const TableView = ({ id, chartData, isScreenSmall, currency, selectedDashboard }: Props) => {
  if (!chartData || chartData.length === 0) {
    return (
      <Box mt={5} textAlign="center">
        <p>No Data Found</p>
      </Box>
    );
  }

  return (
    <TableContainer id={id} style={{ height: isScreenSmall ? '350px' : '400px', width: 'auto' }}>
      <Table stickyHeader id={'table_' + id} aria-label="simple table">
        <TableHead>
          <TableRow>
            {Object.keys(chartData[0]).map((key: string, index) => (
              <TableCell style={{ minWidth: '200px' }} key={key + ' ' + index + 1} align={index === 0 ? 'left' : 'right'}>
                {startCase(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {chartData.map((data: any, index) => (
            <TableRow key={'row ' + index + 1}>
              {Object.keys(data).map((key, i) => (
                <TableCell key={key} align={i < 1 ? 'left' : 'right'}>
                  {isNaN(data[key])
                    ? data[key]
                    : id === 'volumeVsBudget' || key.includes('MT')
                    ? data[key].toFixed(2)
                    : selectedDashboard && selectedDashboard.includes('Asset')
                    ? data[key]
                    : formatAmountWithCurrency(currency, Number(data[key]) ? data[key] : '00').fullFormatAmount}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
