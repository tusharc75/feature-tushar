import { Fragment, useState } from "react";

import {
    Box,
    Grid,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    TableHead,
    TextField
} from '@material-ui/core'
import {Autocomplete} from '@material-ui/lab'
import { MuiPickersUtilsProvider, DatePicker } from "@material-ui/pickers";
import DateFnsUtils from '@date-io/date-fns';
import { startCase } from 'lodash';
import Chart  from 'react-chartjs-2'

import CustomBreadCrumbs from '../../components/CustomBreadCrumbs'
import Layout from '../../components/Layout'


const rand = () => Math.round(Math.random() * 20 - 10);

const data = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      type: 'line',
      label: 'Dataset 1',
      borderColor: 'rgb(54, 162, 235)',
      borderWidth: 2,
      fill: false,
      data: [rand(), rand(), rand(), rand(), rand(), rand()],
    },
    {
      type: 'bar',
      label: 'Dataset 2',
      backgroundColor: 'rgb(255, 99, 132)',
      data: [rand(), rand(), rand(), rand(), rand(), rand(), rand()],
      borderColor: 'white',
      borderWidth: 2,
    },
    {
      type: 'bar',
      label: 'Dataset 3',
      backgroundColor: 'rgb(75, 192, 192)',
      data: [rand(), rand(), rand(), rand(), rand(), rand(), rand()],
    },
  ],
};

const doughnutData = {
  labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const linChartData = {
  labels: ['1', '2', '3', '4', '5', '6'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      fill: false,
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgba(255, 99, 132, 0.2)',
    },
    {
      label: '# of No Votes',
      data: [5, 1, 3, 7, 12, 15],
      fill: false,
      backgroundColor: 'rgb(23, 99, 132)',
      borderColor: 'rgba(23, 99, 132, 0.2)',
    },
    {
      label: '# More Votes',
      data: [5, 3, 8, 4, 7, 12],
      fill: false,
      backgroundColor: 'rgb(200, 204, 140)',
      borderColor: 'rgba(200, 204, 140, 0.2)',
    },
  ],
};

// Table Data 

const tableData = [
    {region: "Alabama", sales: "$150.00"},
    {region: "Delaware", sales: "$144.00"},
    {region: "Ohio", sales: "$125.00"},
    {region: "Colorado", sales: "$117.00"},
    {region: "Calofornia", sales: "$105.00"},
    {region: "Virgina", sales: "$101.00"},
    {region: "Connecticut", sales: "$99.00"},
    {region: "Texas", sales: "$87.00"},
    {region: "Pensylvania", sales: "$82.00"},
    {region: "South Carolina", sales: "$75.00"},
    {region: "Georgia", sales: "$70.00"},
]


const Dashboard = () => {
      const [selectedDate, handleDateChange] = useState(new Date());

    return (
        <Layout>
             <Grid container className="headerbox">
                <CustomBreadCrumbs routes={[{ title: "Dashboard", path: "/dashboard" }]} />
            </Grid>
                <div className="detail-container">  
                    <Paper>
                    <Box p={2} display="flex" alignItems="center" flexDirection="column">
                        <Box my={2} p={2}
                            width="100%"
                            maxWidth="800px"
                            border="1px solid #bababa"
                            textAlign="center"
                        >
                        <Typography variant="h5">
                            Sales by Month
                        </Typography>
                            
                         <Chart type='bar' data={data} />
                        </Box>

                        <Box my={2} display="flex" justifyContent="space-between" alignItems="center">
                            <Box width="400px">
                               <Chart type="doughnut" data={doughnutData} /> 
                            </Box>
                            <Box width="400px">

                            
                            <TableContainer component={Paper}>
                                <Table size="small" style={{width: "100%"}}>
                                    <TableHead>
                                        <TableRow>
                                            {Object.keys(tableData[0]).map((label, i) => (
                                                <TableCell key={label} align={i < 1 ? "left" : "right"}>
                                                    {startCase(label)}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tableData.map((data) => 
                                            <TableRow  key={data.region}>
                                                {Object.keys(data).map((label, i) => (
                                                    <TableCell key={label} align={i < 1 ? "left" : "right"}>
                                                        {data[label]}
                                                   </TableCell>    
                                                ))}
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                                </TableContainer>
                            </Box>
                        </Box>
 
                        <Box my={2}>
                            <Box width="800px">
                                <Grid container spacing={4}>
                                    <Grid xs={12} sm={4} item>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            options={["All opportunities", "All Leads"]}
                                            autoHighlight
                                            getOptionLabel={(option) => option}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Graphs"
                                                    variant="outlined"
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid xs={12} sm={4} item>
                                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                            <DatePicker
                                            inputVariant='outlined'
                                            fullWidth
                                            size="small"
                                            disableFuture
                                            openTo="year"
                                            format="dd/MM/yyyy"
                                            label="Date Created By"
                                            views={["year", "month", "date"]}
                                            value={selectedDate}
                                            onChange={handleDateChange}
                                            />
                                        </MuiPickersUtilsProvider>
                                    </Grid>
                                    <Grid xs={12} sm={4} item>
                                        <Autocomplete
                                            size="small"
                                            fullWidth
                                            options={["Active", "Inactive"]}
                                            autoHighlight
                                            getOptionLabel={(option) => option}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Status"
                                                    variant="outlined"
                                                />
                                            )}
                                        />
                                    </Grid>
                            </Grid>
                              <Chart type="line" data={linChartData} />
                            </Box>
                        </Box>
                    </Box>
                    </Paper>
                </div>
        </Layout>
    )
}

export default Dashboard
