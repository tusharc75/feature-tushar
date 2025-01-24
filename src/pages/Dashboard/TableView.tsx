import { TableBody, Table, TableCell, TableContainer, TableHead, TableRow, Box, IconButton } from '@mui/material';
import { camelCase, startCase } from 'lodash';
import { useEffect, useState } from 'react';
import { formatAmountWithCurrency } from '../../constants/helpers';
import routes from 'src/components/Helpers/Routes';
import { FiExternalLink } from 'react-icons/fi';
import queryString from 'query-string';

interface Props {
  id: string;
  chartData: any[];
  currency: string;
  type: string;
  chart: any;
  filters: any;
}

const TableView = ({ id, chartData, chart, currency, filters }: Props) => {

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
        if (key !== 'value') {
          obj['linkField'] = data[key].value;
        }
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
    const resourcePath = routes[camelCase(chart.kpi.resource)]?.path;
    const queryObj = {};
    queryObj[chart.kpi.redirectField] = tableData[key]?.linkField;
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (Array.isArray(value) && value?.length > 0) {
        queryObj[key] = JSON.stringify(value);
      } else if (!Array.isArray(value) && value) {
        queryObj[key] = JSON.stringify(value);
      }
    });
    window.open(`${resourcePath}?${queryString.stringify(queryObj)}`, '_blank')
  };

  return (
    <TableContainer id={id} style={{ height: '100%', width: 'auto' }}>
      <Table stickyHeader id={'table_' + id} aria-label="simple table">
        <TableHead>
          <TableRow>
            {Object.keys(tableData[0])?.filter(f => f!== 'linkField')?.map((key: string, index) => (
              <TableCell style={{ minWidth: '200px' }} key={key + ' ' + index + 1} align={index === 0 ? 'left' : 'right'}>
                {startCase(key)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((data: any, index) => (
            <TableRow key={'row ' + index + 1}>
              {Object.keys(data)?.filter(f => f!== 'linkField')?.map((key, i) => (
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
              {chart?.kpi?.redirectField && chart?.kpi?.resource && (
                <div className='pt-3'>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      handleRowClick(index);
                    }}
                  >
                    <FiExternalLink size={16} className="text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableView;
