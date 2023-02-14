import { Grid, Box, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import moment from 'moment';
import React, { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import Calander from '../../TechnicianScheduler/Roadmap/Calander';


const RoadMap = () => {


  const toastConfig = useContext(CustomToastContext);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [calendarType, setCalendarType] = useState('week');
  const scrollRef = React.useRef(null);
  const executeScroll = () => {
    var pageElement = document.getElementById('dayLiner');
    var LeftPos = pageElement.offsetLeft;
    document.getElementById('scrollDayLiner').scrollLeft = LeftPos - 200;
  };

  useEffect(() => {
    axiosInstance().get(`/sa-formbuilder/lookup?lookupResource=Product`).then(({ data: { data } }) => {
      setProducts(data["Product"])
    })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchData()
    }
  }, [selectedProduct]);

  const fetchData = () => {
    axiosInstance().get(`/schedule/product-status?products=${selectedProduct}`).then(({ data: { data } }) => {

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


  return (<Box>
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
                {/* <CalanderList
                  fetchRoadmap={fetchRoadmap}
                  activity={activity}
                  expanded={expanded}
                  selected={selected}
                  handleSelect={handleSelect}
                  startDate={startDate}
                  endDate={endDate}
                  totalDay={totalDay}
                  calendarType={calendarType}
                /> */}
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
