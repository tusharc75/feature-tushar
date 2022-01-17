import React from 'react';
import { Box, Grid, Button, Menu, MenuItem, Table, TableBody, TableContainer, TableRow, TableCell, TableHead, Typography } from '@material-ui/core';
import { ImportExport, TableChart, Timeline } from '@material-ui/icons';
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
  smallScreen?: boolean;
  categoryData?: any[];
}

const AssetChart = (props: ChartProps) => {
  const { loading, data, smallScreen, categoryData } = props;
  const [barData, setBarData] = React.useState<ChartData>(null);
  const [pieData, setPieData] = React.useState<ChartData>(null);
  const [tableView, setTableView] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [tableDataRaw, setTableDataRaw] = React.useState([]);

  const msToH = (msTime: number, isDay = false) => {
    if (!msTime || msTime === 0) return 0;
    msTime = msTime / (1000 * 60 * 60);

    if (msTime > 60 * 24 && isDay) msTime = msTime / (60 * 24);

    return msTime;
  };

  const msToPercent = (inUseTime: number, total: number) => {
    if (!inUseTime || inUseTime === 0) return 0;
    if (!total || total === 0) return 0;

    return (inUseTime / total) * 100;
  };

  React.useEffect(() => {
    if (data.length > 0) {
      const length = data.length;
      let total = data.map((_d) => _d?.inUsePercentage).reduce((acc, val) => acc + val) / length ?? 0;
      total = total !== 0 ? parseFloat(total.toFixed(4)) : total;
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
    }

    if (categoryData && categoryData.length > 0) {
      const labels = data.map((_d) => _d?.categoryName);
      const dataSet = categoryData.map((_d) => msToH(_d?.totalUseTime));

      setTableDataRaw(
        data.map((_d) => {
          let dayInMs = 60 * 24 * 60 * 1000;
          let totalTime = _d?.totalUseTime > dayInMs ? Math.floor(msToH(_d?.totalUseTime, true)) : msToH(_d?.totalUseTime, false).toFixed(2);
          return {
            ['Category Name']: _d?.categoryName,
            [`Use Time (${_d?.totalUseTime > dayInMs ? 'In Days' : 'In Hours'})`]: totalTime
          };
        })
      );

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
  }, [data, categoryData]);

  const handleClose = (exportType: string) => () => {
    switch (exportType) {
      case 'ppt': {
        const canvas1 = document.getElementById('utilization-pie-chart') as HTMLCanvasElement;
        const canvas2 = document.getElementById('utilization-chart') as HTMLCanvasElement;
        const dataUrl1 = canvas1.toDataURL('image/png');
        const dataUrl2 = canvas2.toDataURL('image/png');
        const pptx = new PptxGenJs();
        const slide = pptx.addSlide();
        slide.addText('Total Utilization', {
          fontSize: 15,
          color: '363636',
          x: '12%',
          y: '2%',
          fill: { color: 'F1F1F1' },
          align: pptx.AlignH.center
        });
        slide.addImage({ data: dataUrl1, w: '45%', h: '40%', x: '27.5%', y: '5%' });
        slide.addImage({ data: dataUrl2, w: '60%', h: '50%', x: '20%', y: '47%' });
        pptx.writeFile({ fileName: 'Total Utilization.pptx' });
        break;
      }

      case 'pdf': {
        const canvas1 = document.getElementById('utilization-pie-chart') as HTMLCanvasElement;
        const canvas2 = document.getElementById('utilization-chart') as HTMLCanvasElement;
        const dataUrl1 = canvas1.toDataURL('image/png', 1.0);
        const dataUrl2 = canvas2.toDataURL('image/png', 1.0);
        const doc = new jsPDF('portrait');
        doc.setFontSize(20);
        doc.text(`Total Utilization`, 80, 10, { baseline: 'ideographic' });
        doc.addImage(dataUrl1, 'JPEG', 10, 20, 190, 88);
        doc.addImage(dataUrl2, 'JPEG', 8, 130, 190, 100);
        doc.save('Total Utilization.pdf');
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
        saveAs(data, 'Total Utilization' + fileExtension);
        break;
      }

      case 'json': {
        let blob = new Blob([JSON.stringify(tableDataRaw)], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, 'Total Utilization.json');
        break;
      }
      default:
        break;
    }

    setAnchorEl(null);
  };

  if (loading) return <Loader noLoader minHeight={'100%'} text={'Loading chart data...'} />;

  return (
    <React.Fragment>
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
        <div>
          <Button onClick={(event) => setAnchorEl(event.currentTarget)} startIcon={<ImportExport />}>
            Export to
          </Button>
          <Menu id="export-menu-pie" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose('')}>
            <MenuItem onClick={handleClose('ppt')}>Powerpoint</MenuItem>
            <MenuItem onClick={handleClose('pdf')}>PDF</MenuItem>
            <MenuItem onClick={handleClose('excel')}>Excel</MenuItem>
            <MenuItem onClick={handleClose('json')}>Raw JSON</MenuItem>
          </Menu>
        </div>
        <Button onClick={() => setTableView((prevState) => !prevState)} startIcon={!tableView ? <TableChart /> : <Timeline />}>
          {!tableView ? 'Table' : 'Chart'} View
        </Button>
      </Box>
      <Grid container spacing={2} justifyContent="space-between" alignItems="flex-end">
        <Grid item xs={12} sm={tableView && smallScreen ? 12 : 6} md={12}>
          <Box height={smallScreen && tableView ? 450 : 320}>
            
              <Box height={300}>
                <Chart
                  id="utilization-pie-chart"
                  options={{
                    maintainAspectRatio: false
                  }}
                  type="pie"
                  data={pieData}
                />
              </Box>
            
          </Box>
        </Grid>
        <Grid item xs={12} sm={tableView ? 12 : 6} md={12}>
          
          { tableDataRaw.length > 0 ? tableView ? <>
                <Box textAlign={'center'} mb={smallScreen ? 2 : 5}>
                  <Typography variant="h5">Total Utilization</Typography>
                </Box>
                <TableContainer style={{ height: smallScreen ? '400px' : '600px' }}>
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
              </> :  (
            <Box height={330}>
              <Chart
                id="utilization-chart"
                options={{
                  maintainAspectRatio: false
                }}
                type="bar"
                data={barData}
              />
            </Box>
          ) : <div>No Data</div>}
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default AssetChart;
