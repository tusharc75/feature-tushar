import React from 'react';
import { Box, Grid, Button, Menu, MenuItem } from '@material-ui/core';
import { ImportExport } from '@material-ui/icons';
import Chart from 'react-chartjs-2';
import PptxGenJs from 'pptxgenjs';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';

import Loader from '../../../components/Loader';
import { ChartData } from 'chart.js';

interface ChartProps {
  loading: boolean;
  data: any[];
}

const AssetChart = (props: ChartProps) => {
  const { loading, data } = props;
  const [barData, setBarData] = React.useState<ChartData>(null);
  const [pieData, setPieData] = React.useState<ChartData>(null);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [anchorPieEl, setAnchorPieEl] = React.useState(null);
  const [tableDataRaw, setTableDataRaw] = React.useState([]);

  const msToH = (msTime: number) => {
    if (!msTime && msTime === 0) return 0;
    return msTime / (1000 * 60 * 60);
  };

  React.useEffect(() => {
    if (data.length > 0) {
      const length = data.length;
      let total = data.map((_d) => _d?.inUsePercentage).reduce((acc, val) => acc + val) / length ?? 0;
      total = total !== 0 ? parseFloat(total.toFixed(4)) : total;

      const labels = data.map((_d) => _d?.assetNumber);
      const dataSet = data.map((_d) => msToH(_d?.useTime));

      setTableDataRaw(data.map((_d) => ({
        ["Asset Number"]: _d?.assetNumber,
        ["Time (in hours)"]: msToH(_d?.useTime).toFixed(2),
      })))

      setPieData({
        labels: [`In Use (${total} %)`, 'Total Utilization (%)'],
        datasets: [
          {
            label: '(%) Utilization',
            data: [total, 100],
            backgroundColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
            fill: true
          }
        ]
      });

      setBarData({
        labels,
        datasets: [
          {
            label: 'Utilization in hours',
            data: dataSet,
            backgroundColor: 'rgb(54, 162, 235)'
          }
        ]
      });
    }
  }, [data]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseBar = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('utilization-chart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: 'All Entity Sales Chart.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('utilization-chart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total utilization Time`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Total Utilization Time.pdf');
        break;
      }

      case 'excel': {
        // const canvas = document.getElementById('utilization-chart') as HTMLCanvasElement;
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
        saveAs(data, 'Total Utilization Time' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Total Utilization Time.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };


  const handleClickPie = (event) => {
    setAnchorPieEl(event.currentTarget);
  };

  const handleClosePie = (exportType) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas = document.getElementById('utilization-pie-chart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addImage({ data: dataUrl, w: '80%', h: '80%', x: '10%', y: '15%' });
        pptx.writeFile({ fileName: 'Total Utilization.pptx' });
        break;
      }

      case 'pdf': {
        const canvas = document.getElementById('utilization-pie-chart') as HTMLCanvasElement;
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total utilization`, 60, 15);
        doc.addImage(dataUrl, 'JPEG', 10, 20, 190, 100);
        doc.save('Total Utilization.pdf');
        break;
      }

      // case 'excel': {
      //   // const canvas = document.getElementById('utilization-pie-chart') as HTMLCanvasElement;
      //   // const dataUrl = canvas.toDataURL('image/png', 1.0);
      //   const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
      //   const fileExtension = '.xlsx';
      //   const ws = utils.json_to_sheet(tableDataRaw);
      //   const wb = {
      //     Sheets: {
      //       data: ws
      //     },
      //     SheetNames: ['data']
      //   };
      //   const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      //   const data = new Blob([excelBuffer], { type: fileType });
      //   saveAs(data, 'Total Utilization' + fileExtension);
      //   break;
      // }

      // case 'json': {
      //   let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
      //   saveAs(blob, 'Total Utilization.json');
      //   break;
      // }
      default:
        break;
    }

    setAnchorPieEl(null);
  };

  if (loading || !pieData || !barData) return <Loader noLoader minHeight={'100%'} text={'Loading chart data...'} />;

  if (!barData) return <Loader noLoader minHeight={'100%'} text={'No data available'} />;

  return (
    <React.Fragment>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} sm={6} md={12}>
          <Box height={300}>
          <Button onClick={handleClickPie} startIcon={<ImportExport />}>
              Export to
            </Button>
            <Menu id="export-menu-pie" anchorEl={anchorPieEl} keepMounted open={Boolean(anchorPieEl)} onClose={handleClosePie('')}>
              <MenuItem onClick={handleClosePie('ppt')}>Powerpoint</MenuItem>
              <MenuItem onClick={handleClosePie('pdf')}>PDF</MenuItem>
              {/* <MenuItem onClick={handleCloseBar('excel')}>Excel</MenuItem>
              <MenuItem onClick={handleCloseBar('json')}>Raw JSON</MenuItem> */}
            </Menu>
            <Chart
             id="utilization-pie-chart"
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={pieData}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md={12}>
          <Box height={400}>
            <Button onClick={handleClick} startIcon={<ImportExport />}>
              Export to
            </Button>
            <Menu id="export-menu-bar" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleCloseBar('')}>
              <MenuItem onClick={handleCloseBar('ppt')}>Powerpoint</MenuItem>
              <MenuItem onClick={handleCloseBar('pdf')}>PDF</MenuItem>
              <MenuItem onClick={handleCloseBar('excel')}>Excel</MenuItem>
              <MenuItem onClick={handleCloseBar('json')}>Raw JSON</MenuItem>
            </Menu>
            <Chart
              id="utilization-chart"
              options={{
                maintainAspectRatio: false
              }}
              type="bar"
              data={barData}
            />
          </Box>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetChart;
