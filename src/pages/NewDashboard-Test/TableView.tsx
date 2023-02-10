import { TableBody, Table, TableCell, TableContainer, TableHead, TableRow, Box } from '@material-ui/core';
import { startCase } from 'lodash';
import { useEffect, useState } from 'react';
import { formatAmountWithCurrency } from '../../constants/helpers';

interface Props {
  id: string;
  chartData: any[];
  isScreenSmall: boolean;
  currency: string;
  type: string;
  isCurrency: boolean;
}

const TableView = ({ id, chartData, isScreenSmall, isCurrency, currency }: Props) => {
  const [tableData, setTableData] = useState([]);
  useEffect(() => {
    if (!chartData || chartData.length === 0) return;

    const col = Object.keys(chartData[0])
      .map((k) => {
        let b = chartData[0];
        return {
          colName: k,
          order: b[k].order
        };
      })
      .sort((a, b) => a.order - b.order)
      .map((d) => d.colName);
    let tableData = chartData.map((data) => {
      let obj: any = {};
      col.forEach((key) => {
        obj[key] = data[key].value;
      });

      return obj;
    });
    setTableData(tableData);
  }, [chartData]);

  if (!chartData || chartData.length === 0 || tableData.length === 0) {
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
            {Object.keys(tableData[0]).map((key: string, index) => (
              <TableCell style={{ minWidth: '200px' }} key={key + ' ' + index + 1} align={index === 0 ? 'left' : 'right'}>
                {startCase(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((data: any, index) => (
            <TableRow key={'row ' + index + 1}>
              {Object.keys(data).map((key, i) => (
                <TableCell key={key} align={i < 1 ? 'left' : 'right'}>
                  {isNaN(data[key])
                    ? data[key]
                    : id === 'volumeVsBudget' || key.includes('MT') || key.includes('GM')
                      ? data[key]?.toFixed(2)
                      : isCurrency
                        ? formatAmountWithCurrency(currency, Number(data[key]) ? data[key] : '00').fullFormatAmount
                        : data[key]}
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
