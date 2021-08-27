import { useState } from 'react';
import Chart from 'react-chartjs-2';
import { Box, Paper, Typography, Button, Menu, MenuItem } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

const Top2Dashboard = (props) => {
  const {currency, allEntitySalesData, moment} = props
  const [anchorEl, setAnchorEl] = useState(null);
  const [tableView, setTableView] = useState(false);
  const [tableDataRaw, setTableDataRaw] = useState([]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile();
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total Booked Value In ${currency}`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('sales-chart.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('perEntityChart') as HTMLCanvasElement;
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
        FileSaver.saveAs(data, 'sales-data' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, 'sales.json');
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
          <Typography variant="h5">Total booked value in {currency}</Typography>
        </Box>

        <Chart type="bar" data={allEntitySalesData} />
      </Box>
    </Paper>
  );
};

export default Top2Dashboard;
