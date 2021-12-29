import { useState, useCallback, useEffect } from 'react';
import Chart from 'react-chartjs-2';
import { Grid, Box, Paper, Typography } from '@material-ui/core';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';


const OpportunityTrends = (props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const { salesFilter, moment } = props;
  const [oppTrends, setOppTrends] = useState({
    labels: [],
    datasets: []
  });
  const [createdLeads, setCreatedLeads] = useState({
    labels: [],
    datasets: []
  });

  const fetchOppTrends = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
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
    axiosInstance()
      .get(`/dashboard/trend/opportunities${url}`)
      .then(({ data: { data } }) => {
        const won = [];
        const lost = [];
        const open = [];
        const labels = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        for (let d of data) {
          if (d.outcome === 'Won') {
            won.push(d.count);
          }
          if (d.outcome === 'Lost') {
            lost.push(d.count);
          }
          if (d.outcome === '') {
            open.push(d.count);
          }

          if (!labels.includes(d.date)) {
            labels.push(d.date);
          }
        }

        setOppTrends({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'line',
              label: 'Won',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: won
            },
            {
              type: 'line',
              label: 'Lost',
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgb(255, 99, 132, 0.4)',
              borderWidth: 2,
              fill: true,
              data: lost
            },
            {
              type: 'line',
              label: 'Open',
              borderColor: 'rgb(250, 155, 80)',
              backgroundColor: 'rgb(250, 155, 80, 0.4)',
              borderWidth: 2,
              fill: true,
              data: open
            }
          ]
        });
      })
      .catch((err) => { });
  }, [salesFilter, selectedEntity]);

  useEffect(() => {
    fetchOppTrends();
  }, [fetchOppTrends]);

  const fetctCreatedLeads = useCallback(() => {
    let params = {
      entity: selectedEntity || '',
      between: JSON.stringify({
        from: new Date(salesFilter.between.from).toISOString().split('T')[0],
        to: new Date(salesFilter.between.to).toISOString().split('T')[0]
      })
    };

    let url = '?';
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
    axiosInstance()
      .get(`/dashboard/created/leads${url}`)
      .then(({ data: { data } }) => {
        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });

        const dataset = [];
        const labels = [];

        for (let d of data) {
          dataset.push(d.count);
          labels.push(d.date);
        }

        setCreatedLeads({
          labels: labels.map((d) => moment(d).format('MMM/YY')),
          datasets: [
            {
              type: 'bar',
              label: 'Lead Count',
              borderColor: 'rgb(20, 162, 35)',
              backgroundColor: 'rgb(20, 162, 35, 0.4)',
              borderWidth: 2,
              fill: true,
              data: dataset
            }
          ]
        });
      })
      .catch((err) => { });
  }, [selectedEntity, salesFilter.between]);

  useEffect(() => {
    fetctCreatedLeads();
  }, [fetctCreatedLeads]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6">Opportunity Trends</Typography>

            <Chart type="line" data={oppTrends} />
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper>
          <Box p={2}>
            <Typography variant="h6">Created Leads</Typography>

            <Chart type="bar" data={createdLeads} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OpportunityTrends;
