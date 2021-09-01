import { useState, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Box, Paper, Typography, Button, Menu, MenuItem, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const Top2Dashboard = (props) => {
  const { currency, allEntitySalesData, moment, filterCurrency } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [tableView, setTableView] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);

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
        doc.text(`Total Booked Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('All Entity Sales Chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('allEntityChart') as HTMLCanvasElement;
        // const dataUrl = canvas.toDataURL('image/png', 1.0);
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const ws = XLSX.utils.json_to_sheet(tableDataRaw);
        const wb = {
          Sheets: {
            data: ws
          },
          SheetNames: ['data']
        };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        FileSaver.saveAs(data, 'All Entity Sales Chart' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'All Entity Sales Chart.json');
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
          <Typography variant="h5">Total booked value in {filterCurrency || currency}</Typography>
        </Box>

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
    </Paper>
  );
};

export default Top2Dashboard;
