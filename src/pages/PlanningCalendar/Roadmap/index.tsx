import { Box, TextField, Typography } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useVirtualizer } from '@tanstack/react-virtual';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import { downloadExcel } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import ActivityList from './ActivityList';
import Calendar from './Calendar';
import CalendarList from './CalendarList';
import MobileRoadmap from './MobileRoadmap';
import { Activity } from './types';
import { useData } from 'src/StateProvider/Provider';
import CustomDatePicker from 'src/components/CustomDatePicker';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const stateDateFormat = 'YYYY-MM-DD';

const RoadMap = () => {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [products, setProducts] = useState([]);
  const [warehouse, setWarehouse] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const scrollRef = React.useRef(null);

  const [activity, setActivity] = useState<Activity[]>([]);

  const [expanded, setExpanded] = React.useState([]);
  const [selected, setSelected] = React.useState(null);

  const [startDate, setStartDate] = React.useState(`${new Date().getFullYear()}-01-01`);
  const [endDate, setEndDate] = React.useState(`${new Date().getFullYear()}-12-31`);
  const [totalDay, setTotalDay] = React.useState(0);
  const [day, setDay] = React.useState([]);

  useEffect(() => {
    const date1 = moment(startDate, stateDateFormat);
    const date2 = moment(endDate, stateDateFormat);
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
  const dayPixel = 35;

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

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: totalDay,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => dayPixel,
    overscan: 2
  });

  const rowVirtualizer = useVirtualizer({
    count: activity.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => 120,
    overscan: 5,
    measureElement: (d) => {
      const id = d.getAttribute('data-id');
      return expanded.includes(id) ? 120 : 30;
    }
  });

  return (
    <Box>
      <div className="flex flex-wrap justify-between">
        <div className="grid w-full gap-4 md:max-w-[calc(100%-161px)] md:grid-cols-2 xl:grid-cols-4">
          <Autocomplete
            fullWidth
            options={products}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            isOptionEqualToValue={(option: any, val) => option.optionValue === val}
            value={
              products.filter((data) => data.optionValue === selectedProduct).length
                ? products.filter((data) => data.optionValue === selectedProduct)[0]
                : ''
            }
            onChange={(e, val) => {
              setSelectedProduct(val && val.optionValue ? val.optionValue : '');
            }}
            renderInput={(params) => <TextField {...params} margin="dense" size="small" name="product" label="Product" variant="outlined" fullWidth />}
          />
          <Autocomplete
            fullWidth
            options={warehouse}
            getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
            isOptionEqualToValue={(option: any, val) => option.optionValue === val}
            value={
              warehouse.filter((data) => data.optionValue === selectedWarehouse).length
                ? warehouse.filter((data) => data.optionValue === selectedWarehouse)[0]
                : ''
            }
            onChange={(e, val) => {
              setSelectedWarehouse(val && val.optionValue ? val.optionValue : '');
            }}
            renderInput={(params) => (
              <TextField {...params} margin="dense" name="plant" size="small" label={resources?.warehouse?.titleSingular} variant="outlined" fullWidth />
            )}
          />
          <CustomDatePicker
            fullWidth
            size="small"
            value={new Date(startDate)}
            name="startDate"
            label="Start Date"
            onChange={(date: any) => {
              setStartDate(moment(date).format('YYYY-MM-DD'));
            }}
            margin="dense"
          />
          <CustomDatePicker
            fullWidth
            size="small"
            value={new Date(endDate)}
            name="endDate"
            label="End Date"
            onChange={(date: any) => {
              setEndDate(moment(date).format('YYYY-MM-DD'));
            }}
            margin="dense"
          />
        </div>
        <Box display="flex">
          <Box pt={1}>
            <ThemeButton
              onClick={handleExport}
              iconForMobile={false}
            >
              Export to Excel
            </ThemeButton>
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
                      activity={activity}
                      expanded={expanded}
                      selected={selected}
                      handleToggle={handleToggle}
                      handleSelect={handleSelect}
                      rowVirtualizer={rowVirtualizer}
                    />
                    <Box height={70}></Box>
                  </Box>
                </div>
              </Box>
              <div
                id="scrollDayLiner"
                onScroll={onscroll}
                className="relative overflow-auto [border:1px_solid_var(--common-border-color)]"
                ref={scrollRef}
              >
                <Calendar
                  columnVirtualizer={columnVirtualizer}
                  dayPixel={dayPixel}
                  startDate={moment(startDate, stateDateFormat)}
                  endDate={moment(endDate, stateDateFormat)}
                />
                <Box width="100%" height="100%" style={{ position: 'absolute', zIndex: 1 }}>
                  <Box style={{ position: 'absolute', width: totalDay * dayPixel }}>
                    <CalendarList
                      stateDateFormat={stateDateFormat}
                      dayPixel={dayPixel}
                      activity={activity}
                      expanded={expanded}
                      selected={selected}
                      handleSelect={handleSelect}
                      startDate={moment(startDate, stateDateFormat)}
                      endDate={moment(endDate, stateDateFormat)}
                      totalDay={totalDay}
                      rowVirtualizer={rowVirtualizer}
                    />
                  </Box>
                </Box>
                <Box
                  style={{
                    width: `${columnVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                    height: '100%'
                  }}
                >
                  <div>
                    {columnVirtualizer.getVirtualItems().map((virtualColumn) => (
                      <Box
                        key={virtualColumn.index}
                        height={'100%'}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: rowVirtualizer.getTotalSize(),
                          transform: `translateX(${virtualColumn.start}px)`,
                          width: dayPixel
                        }}
                        className={virtualColumn.index % 2 === 0 ? 'bg-[var(--dark-primary-light,#f8fffe)]' : 'bg-[var(--dark-secondary,white)]'}
                      ></Box>
                    ))}
                    <Box
                      id="dayLiner"
                      height={'100%'}
                      style={{
                        position: 'absolute',
                        left: (100 * moment().diff(moment(startDate, stateDateFormat), 'days')) / totalDay + '%',
                        width: dayPixel,
                        height: rowVirtualizer.getTotalSize()
                      }}
                    >
                      <Box style={{ margin: 'auto' }} width={2} border={2} borderColor="var(--common-border-color)" height={'100%'}></Box>
                    </Box>
                  </div>
                </Box>
              </div>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default RoadMap;
