import { TableBody, Table, TableCell, TableContainer, TableHead, TableRow, Box, IconButton } from '@mui/material';
import { startCase } from 'lodash';
import { useEffect, useState } from 'react';
import { formatAmountWithCurrency } from '../../constants/helpers';
import routes from 'src/components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';

interface Props {
  id: string;
  chartData: any[];
  currency: string;
  type: string;
  chart: any;
}

const TableView = ({ id, chartData, chart, currency }: Props) => {
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

  const handleRowClick = (key: any) => {
    const assetStatus = tableData[key].status;
    const url = `${routes.serializedAsset.path}?assetStatus=${encodeURIComponent(assetStatus)}`;
    window.open(url, '_blank');
  };

  return (
    <TableContainer id={id} style={{ height: '100%', width: 'auto' }}>
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
                      : chart?.currency
                        ? formatAmountWithCurrency(currency, Number(data[key]) ? data[key] : '00').fullFormatAmount
                        : chart?.percentage
                          ? `${data[key]}%`
                          : data[key]}
                </TableCell>
              ))}
              {chart?.kpi?.name === 'Asset Status Count' && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    handleRowClick(index);
                  }}
                >
                  <FiExternalLink size={16} className="mt-3 text-gray-500 dark:text-gray-300" />
                </IconButton>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
