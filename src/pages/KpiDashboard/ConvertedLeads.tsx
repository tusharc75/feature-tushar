import {useState} from 'react';
import { Grid, Box, TextField } from '@material-ui/core'
import { Autocomplete } from '@material-ui/lab';
import { DatePicker } from '@material-ui/pickers';
import { dateFormatForInputControl } from '../../constants/helpers';


const linChartData = {
  labels: ['1', '2', '3', '4', '5', '6'],
  datasets: [
    {
      label: '# of Votes',
      data: [12, 19, 3, 5, 2, 3],
      fill: false,
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgba(255, 99, 132, 0.2)'
    },
    {
      label: '# of No Votes',
      data: [5, 1, 3, 7, 12, 15],
      fill: false,
      backgroundColor: 'rgb(23, 99, 132)',
      borderColor: 'rgba(23, 99, 132, 0.2)'
    },
    {
      label: '# More Votes',
      data: [5, 3, 8, 4, 7, 12],
      fill: false,
      backgroundColor: 'rgb(200, 204, 140)',
      borderColor: 'rgba(200, 204, 140, 0.2)'
    }
  ]
};


const ConvertedLeads = ({ Chart }) => {
  const [selectedDate, handleDateChange] = useState(new Date());

  return <div>
    <Box width="800px">
                  <Grid container spacing={4}>
                    <Grid xs={12} sm={4} item>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={['All opportunities', 'All Leads']}
                        autoHighlight
                        getOptionLabel={(option) => option}
                        renderInput={(params) => <TextField {...params} label="Graphs" variant="outlined" />}
                      />
                    </Grid>
                    <Grid xs={12} sm={4} item>
                      <DatePicker
                        inputVariant="outlined"
                        fullWidth
                        size="small"
                        openTo="year"
                        format={dateFormatForInputControl}
                        label="Date Created By"
                        views={['year', 'month', 'date']}
                        value={selectedDate}
                        onChange={handleDateChange}
                      />
                    </Grid>
                    <Grid xs={12} sm={4} item>
                      <Autocomplete
                        size="small"
                        fullWidth
                        options={['Active', 'Inactive']}
                        autoHighlight
                        getOptionLabel={(option) => option}
                        renderInput={(params) => <TextField {...params} label="Status" variant="outlined" />}
                      />
                    </Grid>
                  </Grid>
                  <Chart type="line" data={linChartData} />
                </Box>
  </div>;
};

export default ConvertedLeads;
