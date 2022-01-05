import React from 'react'
import { ChartData } from 'chart.js';
import Chart from 'react-chartjs-2';
import axiosInstance from '../../../axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { Box, TextField, Checkbox, Typography } from '@material-ui/core';
import { CheckBoxOutlineBlank, CheckBox } from '@material-ui/icons';


const AssetStatusChart = ({productCategories, loadingProductCategory}) => {
  const [pieData, setPieData] = React.useState<ChartData>(null)
  const [selectedProductCategories, setSelectedProductCategories] = React.useState([]);


  React.useEffect(() => {
    if (selectedProductCategories.length > 0) {
      productWithStatus()
    }
  }, [selectedProductCategories]);

  const getSum = (array, column) => {
    let values = array.map((item) => parseInt(item[column]) || 0)
    return values.reduce((a, b) => a + b)
  }
  const ignoreId = ["productName", "_id"]
  const productWithStatus = () => {
    let filterById = [];
    selectedProductCategories.forEach(d => {
      filterById.push(d.id);
    })
    axiosInstance()
      .get(`/dashboard/product-with-status-count?productCategory=${JSON.stringify(filterById)}`)
      .then(({ data: { data } }) => {
        let labels = []
        let values = []
        if (data.data.length > 0) {
          Object.keys(data.data[0]).map((label: any) => {
            if (!ignoreId.includes(label)) {
              values.push(getSum(data.data, label))
              labels.push(label)
            }
          }
          )
        }
        setPieData({
          "labels": labels,
          datasets: [{
            label: "(%) Utilization",
            data: values,
            backgroundColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(255, 99, 132, 0.6)'
            ],
            fill: true
          }]
        })
      })
  };

  return (
    <div>
       <Box width={200} mb={1}>
            <Autocomplete
              disabled={loadingProductCategory}
              fullWidth
              disableListWrap
              loading={loadingProductCategory}
              loadingText={'Loading...'}
              multiple={true}
              value={selectedProductCategories}
              options={productCategories}
              disableCloseOnSelect
              limitTags={2}
              onChange={(_, newVal) => setSelectedProductCategories(newVal)}
              getOptionSelected={(option, value) => option.id === value.id}
              getOptionLabel={(option) => option.title}
              renderOption={(option, { selected }) => (
                <React.Fragment>
                  <Checkbox
                    icon={<CheckBoxOutlineBlank fontSize="small" />}
                    checkedIcon={<CheckBox fontSize="small" />}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.title}
                </React.Fragment>
              )}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Product Category" size="small" />}
            />
          </Box>
         
          <Box height={400}>
          {!pieData && <React.Fragment> 
            <Typography>Select product category to vizualise data</Typography>
            </React.Fragment>}
            <Chart
              options={{
                maintainAspectRatio: false
              }}
              type="pie"
              data={pieData}
            />
          </Box>
    </div>
  )
}

export default AssetStatusChart
