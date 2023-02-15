import { Grid, Box, TextField, Typography, Button } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import moment from 'moment';
import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import { downloadExcel } from 'src/constants/helpers';
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import Calander from '../../TechnicianScheduler/Roadmap/Calander';
import ActivityList from './ActivityList';
import CalanderList from './CalanderList';

const RoadMap = () => {


  const toastConfig = useContext(CustomToastContext);
  const [products, setProducts] = useState([]);
  const [warehouse, setWarehouse] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [calendarType, setCalendarType] = useState('week');
  const scrollRef = React.useRef(null);

  const [activity, setActivity] = useState([]);

  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data) => {
    setSelected(data?._id);
  };

  const executeScroll = () => {
    var pageElement = document.getElementById('dayLiner');
    var LeftPos = pageElement.offsetLeft;
    document.getElementById('scrollDayLiner').scrollLeft = LeftPos - 200;
  };

  useEffect(() => {
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Product,Warehouse`).then(({ data: { data } }) => {
      setProducts(data["Product"])
      setWarehouse(data["Warehouse"])
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchRoadmap()
    }
  }, [selectedProduct, selectedWarehouse]);

  const fetchRoadmap = () => {
    var api = '/schedule/product-status'
    var query = ''
    if (selectedProduct) {
      query = query + `?products=${selectedProduct}&`
    }
    if (selectedWarehouse) {
      query = query + `warehouse=${selectedWarehouse}`
    }
    axiosInstance().get(api + query).then(({ data: { data } }) => {
      setActivity(data)
      executeScroll()
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  let height = window.innerHeight - 300;
  let startDate = moment("2021-01-01");
  let endDate = moment("2023-12-31");
  let totalDay = endDate.diff(startDate, 'days');
  var dayPixel = 0;
  if (calendarType === 'month') {
    dayPixel = 8.5;
  } else if (calendarType === 'week') {
    dayPixel = 35;
  } else {
    dayPixel = 3;
  }

  const taskScroolRef = React.useRef(null);
  const onscroll = (event) => {
    var target = event.nativeEvent.target;
    taskScroolRef.current.scrollTop = target.scrollTop;
  };

  const handleExport = () => {
    var api = '/schedule/product-status/export'
    if (selectedWarehouse) {
      api = api + `?warehouse=${selectedWarehouse}`
    }
    axiosInstance().get(api, {
      responseType: 'arraybuffer'
    })
      .then((response) => {
        const fileName = response.headers['content-disposition'].split('filename=')[1];
        downloadExcel(response.data, fileName);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Exported to excel successfully.'
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }

  return (<Box>
    <Box display="flex" justifyContent="space-between" >
      <Box display="flex">
        <Box>
          <Autocomplete
            style={{ width: '300px' }}
            options={products}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            getOptionSelected={(option: any, val) => option.optionValue === val}
            value={products.filter((data) => data.optionValue === selectedProduct).length ? products.filter((data) => data.optionValue === selectedProduct)[0] : ''}
            onChange={(e, val) => {
              setSelectedProduct(val && val.optionValue ? val.optionValue : '');
            }}
            renderInput={(params) =>
              <TextField
                {...params}
                margin="dense"
                name="product"
                label="Product"
                variant="outlined"
                fullWidth />
            }
          />
        </Box>
        <Box ml={2}>
          <Autocomplete
            style={{ width: '300px' }}
            options={warehouse}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            getOptionSelected={(option: any, val) => option.optionValue === val}
            value={warehouse.filter((data) => data.optionValue === selectedWarehouse).length ? warehouse.filter((data) => data.optionValue === selectedWarehouse)[0] : ''}
            onChange={(e, val) => {
              setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
            }}
            renderInput={(params) =>
              <TextField
                {...params}
                margin="dense"
                name="plant"
                label="Plant"
                variant="outlined"
                fullWidth />
            }
          />
        </Box>
      </Box>
      <Box display="flex">
        <Box pt={1}>
          <Button
            variant='contained'
            size="small"
            className={'btn-outline-v1'}
            onClick={handleExport}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>
    </Box>
    <Box bgcolor="white" pt={2}>
      <Box border={1} borderColor="grey.300" display="flex" height={height} style={{ position: 'relative' }}>
        <Box display="flex" width="100%" height="100%" style={{ position: 'absolute' }}>
          <Box minWidth={300} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'hidden' }}>
            <Box height={60} bgcolor="grey.200" display="flex" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              <Box p={2} display="flex" alignItems="center">
                <Typography variant="body1" display="block">
                  Products
                </Typography>
              </Box>
            </Box>
            <div
              ref={taskScroolRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
            >
              <Box>
                <ActivityList
                  fetchRoadmap={fetchRoadmap}
                  activity={[{ _id: "1", name: "Planned", color: "#FEF5D6" }, { _id: "2", name: "In-Use", color: "#FFEEF3" }, { _id: "3", name: "Available", color: "#EFF8FF" }]}
                  expanded={expanded}
                  selected={selected}
                  handleToggle={handleToggle}
                  handleSelect={handleSelect}
                />
              </Box>
            </div>
          </Box>
          <Box id="scrollDayLiner" onScroll={onscroll} border={1} borderColor="grey.300" style={{ position: 'relative', overflow: 'auto' }}>
            <Calander
              calendarType={calendarType}
              dayPixel={dayPixel}
              startDate={startDate}
              endDate={endDate}
            />
            <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
              <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                <CalanderList
                  fetchRoadmap={fetchRoadmap}
                  activity={activity}
                  expanded={expanded}
                  selected={selected}
                  handleSelect={handleSelect}
                  startDate={startDate}
                  endDate={endDate}
                  totalDay={totalDay}
                  calendarType={calendarType}
                />
              </Box>
            </Box>
            <Box width={totalDay * dayPixel} height={'100%'} style={{ position: 'sticky', top: 0, bottom: 0 }}>
              <div ref={scrollRef}>
                <Box
                  id="dayLiner"
                  height={'100%'}
                  style={{
                    position: 'absolute',
                    left: (100 * moment().diff(startDate, 'days')) / totalDay + '%',
                    width: dayPixel
                  }}
                >
                  <Box style={{ margin: 'auto' }} width={2} border={2} borderColor="secondary.main" height={'100%'}></Box>
                </Box>
              </div>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  </Box>
  );
};

export default RoadMap;
