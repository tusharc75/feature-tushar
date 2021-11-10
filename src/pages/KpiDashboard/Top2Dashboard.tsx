import { useState, useEffect, useCallback } from 'react';
import Chart from 'react-chartjs-2';
import { Box, Paper, Typography, Button, Menu, MenuItem, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import axiosInstance from '../../axios/axiosInstance';
import Loader from '../../components/Loader';

const Top2Dashboard = (props) => {
  const { currency, salesFilter, moment, filterCurrency, getExchangeRates } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [tableView, setTableView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);
  const [allEntitySalesData, setAllEntitySalesData] = useState({
    labels: [],
    datasets: [],
    allData: []
  });

  const fetchAllEntitiesData = useCallback(() => {
    let params = {
      marketSegment: salesFilter.marketSegment ? salesFilter.marketSegment['id'] : '',
      subMarketSegment: salesFilter.subMarketSegment ? salesFilter.subMarketSegment['id'] : '',
      customerAccount: salesFilter.customerAccount ? salesFilter.customerAccount['id'] : '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?allEntity=1&';
    for (const k of Object.keys(params)) {
      if (params[k]) {
        if (k === 'between' && salesFilter.between.from && salesFilter.between.to) {
          url = `${url}${k}=${params[k]}&`;
        }
        if (k !== 'between') {
          url = `${url}${k}=${params[k]}&`;
        }
      }
    }

    setLoading(true);
    axiosInstance()
      .get(`dashboard/sales${url}`)
      .then(async ({ data: { data } }) => {
        const saleData = [];
        const labels = [];
        const budget = [];
        const allEntitiesChart = [];
        const allEntities = [];
        const entityIds = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          saleData.push(d.totalSell);

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
          budget.push(d.budget);

          if (!entityIds.includes(d.entityId)) {
            entityIds.push(d.entityId);
          }
        }

        for (const id of entityIds) {
          let chartObj = {};
          let obj = {};
          let dataset = [];
          const entitySale = await data.filter((d) => d.entityId === id);

          for (const sale of entitySale) {
            if (filterCurrency && filterCurrency !== currency) {
              const totalSelldata = await getExchangeRates(moment(sale.date).format('YYYY-MM-DD'), sale.totalSell);
              dataset.push(totalSelldata ? totalSelldata.rates[filterCurrency] : sale.totalSell);
            } else {
              dataset.push(sale.totalSell);
            }
          }

          obj = {
            entityName: entitySale[0].entity,
            totalCost: entitySale.map((d) => d.totalCost).reduce((acc, total) => acc + total),
            totalSell: entitySale.map((d) => d.totalSell).reduce((acc, total) => acc + total),
            budget: entitySale.map((d) => d.budget || 0).reduce((acc, total) => acc + total),
            period: `${moment(entitySale[0].date).format('MMM/YY')} - ${moment(entitySale[entitySale.length - 1].date).format('MMM/YY')}`
          };
          chartObj = {
            type: 'line',
            label: entitySale[0].entity,
            borderColor: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
            borderWidth: 2,
            data: dataset
          };

          allEntities.push(obj);
          allEntitiesChart.push(chartObj);
        }

        setAllEntitySalesData({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: allEntitiesChart,
          allData: allEntities
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [salesFilter.customerAccount, salesFilter.subMarketSegment, salesFilter.marketSegment, salesFilter.between, filterCurrency]);

  useEffect(() => {
    fetchAllEntitiesData();
  }, [fetchAllEntitiesData]);

  useEffect(() => {
    const tableD = allEntitySalesData.allData.map((d) => ({
      ['Period']: d.period,
      ['Entity Name']: d.entityName,
      ['Budget']: d.budget.toLocaleString(),
      ['Total Sell']: d.totalSell.toLocaleString(),
      ['Total Cost']: d.totalCost.toLocaleString()
    }));
    setTableDataRaw(tableD);
  }, [allEntitySalesData]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('allEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: 'All Entity Sales Chart.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('allEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total offered Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('All Entity Sales Chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('allEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = utils.json_to_sheet(tableDataRaw);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        saveAs(data, 'All Entity Sales Chart' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'All Entity Sales Chart.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  return (
    <Paper elevation={2}>
      <Box my={2} p={2}>
        <Box display="flex" justifyContent="space-between">
          <Button onClick={handleClick} startIcon={<ImportExport />}>
            Export to
          </Button>
          <Button
            onClick={() => {
              setTableView(!tableView);
            }}
            startIcon={!tableView ? <TableChart /> : <Timeline />}
          >
            {!tableView ? 'Table' : 'Chart'} View
          </Button>
          <Menu id="export-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('')}>
            <MenuItem onClick={handleClose('ppt')}>Powerpoint</MenuItem>
            <MenuItem onClick={handleClose('pdf')}>PDF</MenuItem>
            <MenuItem onClick={handleClose('excel')}>Excel</MenuItem>
            <MenuItem onClick={handleClose('json')}>Raw JSON</MenuItem>
          </Menu>
        </Box>
        <Box textAlign="center">
          <Typography variant="h5">Total offered value in {filterCurrency || currency}</Typography>
        </Box>

        {!loading ? (
          <Box>
            {!tableView ? (
              <Chart id="allEntityChart" type="bar" data={allEntitySalesData} />
            ) : (
              <TableContainer style={{ height: '400px' }}>
                <Table stickyHeader aria-label="caption table">
                  <TableHead>
                    <TableRow>
                      {Object.keys(tableDataRaw[0]).map((label, i) => (
                        <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableDataRaw.map((data, index) => (
                      <TableRow key={index}>
                        {Object.keys(data).map((label, i) => (
                          <TableCell key={label} align={i < 1 ? 'left' : 'right'}>
                            {data[label].toLocaleString()}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        ) : (
          <Loader minHeight={400} text="Loading Data..." />
        )}
      </Box>
    </Paper>
  );
};

export default Top2Dashboard;
