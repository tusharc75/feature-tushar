import React from 'react';
import { ChartData } from 'chart.js';
import Chart from 'react-chartjs-2';
import {
  Paper,
  Box,
  Grid,
  useTheme,
  useMediaQuery,
  Typography,
  Button,
  TableBody,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';

import { BsFilter } from 'react-icons/bs';
import FiltersDropdown from './FiltersDropdown';
import axiosInstance from '../../axios/axiosInstance';

interface Props {
  chart: {
    col: any;
    type: string;
    filters: { key: string; title: string; multiple: boolean }[];
    title: string;
    kpi: string;
    hasFilter: boolean;
    hasTableView: boolean;
    hasExport: boolean;
  };
  filterData: any;
}

const ChartTypes = ({ chart, filterData }: Props) => {
  const theme = useTheme();
  const isScreenSmall = useMediaQuery(theme.breakpoints.down('md'));
  const [tableView, setTableView] = React.useState(false);
  const [filterValues, setFilterValues] = React.useState(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const data: ChartData = {
    labels: ['Boston', 'Worcester', 'Springfield', 'Lowell', 'Cambridge', 'New Bedford'],
    datasets: [
      {
        fill: true,
        data: [617594, 181045, 153060, 106519, 105162, 95072],
        //backgroundColor:'green',
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)'
        ]
      }
    ]
  };

  const handleOpenFilter = React.useCallback((e: React.MouseEvent) => {
    setAnchorEl(e.target);
  }, []);

  function createData(name: string, calories: number) {
    return { name, calories };
  }

  const rows = [
    createData('Frozen yoghurt', 159),
    createData('Ice cream sandwich', 237),
    createData('Eclair', 262),
    createData('Cupcake', 305),
    createData('Gingerbread', 356),
    createData('Pancake', 400),
    createData('Chocholate', 800),
    createData('Mango', 259),
    createData('Peaches', 259),
    createData('Guava', 150),
    createData('Kiwi', 120),
    createData('Butterscotch', 300),
    createData('Apple Pie', 600),
    createData('Smoothie', 350)
  ];

  const fetchData = React.useCallback(() => {
    const urlParams = '';
    axiosInstance().get(`dashboards/${chart.kpi}?${urlParams}`);
  }, []);

  return (
    <Grid item xs={12} md={chart.col}>
      <Box component={Paper} p={'8px'} height={'100%'}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex">
              {chart.hasFilter && (
                <Button
                  onClick={handleOpenFilter}
                  variant="outlined"
                  size="small"
                  disableElevation
                  color="primary"
                  startIcon={<BsFilter fontSize={14} />}
                >
                  Filters
                </Button>
              )}
            </Box>
            <Box display="flex">
              {chart.hasExport && (
                <Button onClick={() => {}} size="small" startIcon={<ImportExport />}>
                  Export to
                </Button>
              )}
              {chart.hasTableView && (
                <Button
                  onClick={() => {
                    setTableView(!tableView);
                  }}
                  startIcon={!tableView ? <TableChart /> : <Timeline />}
                >
                  {!tableView ? 'Table' : 'Chart'} View
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="h5" align="center">
            {chart.title}
          </Typography>
        </Box>
        <Box minHeight={isScreenSmall ? '100%' : 500}>
          {chart.type !== 'list' ? (
            <Chart
              type={chart.type}
              data={data}
              options={{
                maintainAspectRatio: isScreenSmall ? true : false
              }}
            />
          ) : (
            <TableContainer style={{ height: '450px' }}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Dessert (100g serving)</TableCell>
                    <TableCell align="right">Calories</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell component="th" scope="row">
                        {row.name}
                      </TableCell>
                      <TableCell align="right">{row.calories}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {chart.hasFilter && filterData && (
        <FiltersDropdown
          closeAnchor={() => setAnchorEl(null)}
          anchorEl={anchorEl}
          filters={chart.filters}
          values={filterValues}
          setValues={setFilterValues}
          filterOptions={filterData}
        />
      )}
    </Grid>
  );
};

export default ChartTypes;
