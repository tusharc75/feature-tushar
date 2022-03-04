import { TableBody, Table, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { startCase } from 'lodash';
import { formatAmountWithCurrency } from '../../constants/helpers';

interface Props {
  id: string;
  chartData: any[];
  isScreenSmall: boolean;
  currency: string;
  type: string;
}

const TableView = ({ id, chartData, isScreenSmall, currency }: Props) => {
  return (
    <TableContainer id={id} style={{ height: isScreenSmall ? '350px' : '500px' }}>
      <Table id={'table_' + id} aria-label="simple table">
        <TableHead>
          <TableRow>
            {Object.keys(chartData[0]).map((key: string, index) => (
              <TableCell key={key + ' ' + index + 1} align={index === 0 ? 'left' : 'right'}>
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
                    : id === 'volumeVsBudget'
                    ? data[key].toFixed(2)
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
