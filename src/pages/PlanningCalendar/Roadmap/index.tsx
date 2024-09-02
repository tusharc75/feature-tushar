import { Grid, Box, TextField, Typography, Button } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { dateFormat, downloadExcel } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import Calendar from '../../TechnicianScheduler/Roadmap/Calendar';
import ActivityList from './ActivityList';
import CalendarList from './CalendarList';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import routes from 'src/components/Helpers/Routes';
import MobileRoadmap from './MobileRoadmap';
import { isMobile, isTablet } from 'react-device-detect';

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

  const [startDate, setStartDate] = React.useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = React.useState(`${new Date().getFullYear()}-12-31`);
  const [totalDay, setTotalDay] = React.useState(0);
  const [day, setDay] = React.useState([]);

  useEffect(() => {
    const date1 = moment(startDate);
    const date2 = moment(endDate);
    const diff = date2.diff(date1, 'days');
    setTotalDay(diff);
    executeScroll();
  }, [startDate, endDate]);

  useEffect(() => {
    const arr = [];
    for (let i = 0; i <= totalDay; i++) {
      arr.push(i);
    }
    setDay(arr);
  }, [totalDay]);

  const handleToggle = (event, nodeIds) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event, data) => {
    setSelected(data?._id);
  };

  const executeScroll = () => {
    if (isMobile && !isTablet) return;
    var pageElement = document.getElementById('dayLiner');
    var LeftPos = pageElement?.offsetLeft;
    document.getElementById('scrollDayLiner').scrollLeft = LeftPos - 200;
  };

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=Product,Warehouse`)
      .then(({ data: { data } }) => {
        setProducts(data['Product']);
        setWarehouse(data['Warehouse']);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [selectedProduct, selectedWarehouse]);

  const fetchRoadmap = () => {
    var api = '/planning/product-status';
    var query = `?startDate=${startDate}&endDate=${endDate}`;
    if (selectedProduct) {
      query = query + `&product=${selectedProduct}`;
    }
    if (selectedWarehouse) {
      query = query + `&warehouse=${selectedWarehouse}`;
    }
    axiosInstance()
      .get(api + query)
      .then(({ data: { data } }) => {
        setActivity(data);
        setExpanded(data?.map((e) => e?._id));
        executeScroll();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  let height = window.innerHeight - 300;
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
    var api = `/planning/product-status/export?startDate=${startDate}&endDate=${endDate}`;
    if (selectedWarehouse) {
      api = api + `&warehouse=${selectedWarehouse}`;
    }
    axiosInstance()
      .get(api, {
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
  };

  return (
    <Box>
      <div className="flex flex-wrap justify-between">
        <div className="grid w-full gap-4 md:max-w-[calc(100%-161px)] md:grid-cols-2 xl:grid-cols-4">
          <MuiPickersUtilsProvider utils={MomentUtils}>
            <Autocomplete
              fullWidth
              options={products}
              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                products.filter((data) => data.optionValue === selectedProduct).length
                  ? products.filter((data) => data.optionValue === selectedProduct)[0]
                  : ''
              }
              onChange={(e, val) => {
                setSelectedProduct(val && val.optionValue ? val.optionValue : '');
              }}
              renderInput={(params) => <TextField {...params} margin="dense" name="product" label="Product" variant="outlined" fullWidth />}
            />
            <Autocomplete
              fullWidth
              options={warehouse}
              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                warehouse.filter((data) => data.optionValue === selectedWarehouse).length
                  ? warehouse.filter((data) => data.optionValue === selectedWarehouse)[0]
                  : ''
              }
              onChange={(e, val) => {
                setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
              }}
              renderInput={(params) => (
                <TextField {...params} margin="dense" name="plant" label={routes.warehouse.title} variant="outlined" fullWidth />
              )}
            />
            <KeyboardDatePicker
              autoOk
              fullWidth
              size="small"
              variant="inline"
              inputVariant="outlined"
              value={new Date(startDate)}
              name="startDate"
              label="Start Date"
              onChange={(date: any) => {
                setStartDate(moment(date).format('YYYY-MM-DD'));
              }}
              format={dateFormat}
              InputLabelProps={{
                shrink: true
              }}
              margin="dense"
            />
            <KeyboardDatePicker
              autoOk
              fullWidth
              size="small"
              variant="inline"
              inputVariant="outlined"
              value={new Date(endDate)}
              name="endDate"
              label="End Date"
              onChange={(date: any) => {
                setEndDate(moment(date).format('YYYY-MM-DD'));
              }}
              format={dateFormat}
              InputLabelProps={{
                shrink: true
              }}
              margin="dense"
            />
          </MuiPickersUtilsProvider>
        </div>
        <Box display="flex">
          <Box pt={1}>
            <Button variant="contained" size="small" className={'btn-outline-v1'} onClick={handleExport}>
              Export to Excel
            </Button>
          </Box>
        </Box>
      </div>
      {isMobile && !isTablet ? (
        <MobileRoadmap
          activity={activity}
          expanded={expanded}
          selected={selected}
          setSelected={setSelected}
          handleToggle={handleToggle}
          handleSelect={handleSelect}
        />
      ) : (
        <Box pt={2}>
          <Box border={1} borderColor="var(--common-border-color)" display="flex" height={height} style={{ position: 'relative' }}>
            <Box display="flex" width="100%" height="100%" style={{ position: 'absolute' }}>
              <Box minWidth={300} border={1} borderColor="var(--common-border-color)" style={{ position: 'relative', overflow: 'hidden' }}>
                <Box height={60} bgcolor="var(--dark-secondary, grey.200)" display="flex" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
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
                      activity={activity}
                      expanded={expanded}
                      selected={selected}
                      handleToggle={handleToggle}
                      handleSelect={handleSelect}
                    />
                    <Box height={70}></Box>
                  </Box>
                </div>
              </Box>
              <Box
                id="scrollDayLiner"
                onScroll={onscroll}
                border={1}
                borderColor="var(--common-border-color)"
                style={{ position: 'relative', overflow: 'auto' }}
              >
                <Calendar calendarType={calendarType} dayPixel={dayPixel} startDate={moment(startDate)} endDate={moment(endDate)} />
                <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
                  <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                    <CalendarList
                      fetchRoadmap={fetchRoadmap}
                      activity={activity}
                      expanded={expanded}
                      selected={selected}
                      handleSelect={handleSelect}
                      startDate={moment(startDate)}
                      endDate={moment(endDate)}
                      totalDay={totalDay}
                      calendarType={calendarType}
                    />
                  </Box>
                </Box>
                <Box width={totalDay * dayPixel} height={'100%'} style={{ position: 'sticky', top: 0, bottom: 0 }}>
                  <div ref={scrollRef}>
                    {day?.map((day) => {
                      return (
                        <Box
                          height={'100%'}
                          style={{
                            position: 'absolute',
                            left: day * dayPixel,
                            width: dayPixel,
                            background: day % 2 === 0 ? 'var(--dark-primary-light, #f8fffe)' : 'var(--dark-secondary, white)'
                          }}
                        ></Box>
                      );
                    })}
                    <Box
                      id="dayLiner"
                      height={'100%'}
                      style={{
                        position: 'absolute',
                        left: (100 * moment().diff(moment(startDate), 'days')) / totalDay + '%',
                        width: dayPixel
                      }}
                    >
                      <Box style={{ margin: 'auto' }} width={2} border={2} borderColor="var(--common-border-color)" height={'100%'}></Box>
                    </Box>
                  </div>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RoadMap;
