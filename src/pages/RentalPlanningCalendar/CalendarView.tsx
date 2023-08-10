import React, { useEffect, useCallback, useMemo, useState, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { Calendar, View, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import './calendarView.scss';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import {
  Grid,
  makeStyles,
  Checkbox,
  TextField,
  ButtonGroup,
  Button,
  Popper,
  Paper,
  ClickAwayListener,
  MenuList,
  MenuItem,
  Grow,
  Box
} from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import routes from 'src/components/Helpers/Routes';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const DragAndDropCalendar = withDragAndDrop(Calendar as any);
const localizer = momentLocalizer(moment);
const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const options = ['All', 'Rental', 'Planning'];
const rentalPlanningCalendarType = ['Rental/Planning', 'Assets'];

function CalendarView() {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const [open, setOpen] = React.useState(false);
  const [openRentalPlanningCalendarType, setOpenRentalPlanningCalendarType] = React.useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [selectedRentalPlanningCalendarType, setSelectedRentalPlanningCalendarType] = useState(rentalPlanningCalendarType[0]);
  const [events, setEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState([]);
  const [view, setView] = useState<View>('month');
  const [staticEvents, setStaticEvents] = useState([]);
  const [filterToKeep, setFilterToKeep] = useState([]);
  const [warehouse, setWarehouse] = useState([]);
  const [product, setProduct] = useState([]);
  const [asset, setAsset] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState([]);
  const [dateRange, setDateRange] = useState({
    estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [month, setMonth] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [week, setWeek] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [day, setDay] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });

  const [renderCount, setRenderCount] = useState(0);

  const [updateCount, setUpdateCount] = useState(0);

  const anchorRef = React.useRef<HTMLDivElement>(null);
  const anchorRef1 = React.useRef<HTMLDivElement>(null);

  const defaultDate = useMemo(() => moment().toDate(), []);

  const FILTERS = {
    warehouse: 'Plant',
    product: 'Product',
    asset: 'Asset'
  };

  useEffect(() => {
    if (view === 'month') {
      setMonth({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    } else if (view === 'week') {
      setWeek({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    } else if (view === 'day') {
      setDay({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    }
  }, [dateRange]);

  useEffect(() => {
    axiosInstance()
      .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Product,Serialized Asset')
      .then(({ data: { data } }) => {
        setProduct(data['Product']);
        setAsset(data['Serialized Asset']);
        setWarehouse(data['Warehouse']);
      })
      .catch((err) => {});
  }, []);

  const queryData = (data) => {
    let queryData = null;
    data.forEach((item, i) => {
      if (i === 0) {
        queryData = item.optionValue;
      } else {
        queryData = queryData + ',' + item.optionValue;
      }
    });
    return queryData;
  };

  const getQueryString = () => {
    const api = '/rental-planning-calendar';
    const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`;
    let query = `${api}?date=${date}`;

    if (selectedRentalPlanningCalendarType === rentalPlanningCalendarType[1]) {
      query = `${api}/assets`;
    }

    if (selectedWarehouse.length > 0) {
      const warehouse = queryData(selectedWarehouse);
      query = `${query}&warehouse=${warehouse}`;
    }
    if (selectedProduct.length > 0) {
      const product = queryData(selectedProduct);
      query = `${query}&product=${product}`;
    }
    if (selectedAsset.length > 0) {
      const asset = queryData(selectedAsset);
      if (selectedRentalPlanningCalendarType === rentalPlanningCalendarType[1]) {
        query = `${query}?assets=${asset}`;
      } else {
        query = `${query}&asset=${asset}`;
      }
    }

    if (selectedRentalPlanningCalendarType === rentalPlanningCalendarType[1] && selectedAsset.length === 0) {
      query = null;
    }

    return query;
  };

  const createDataForCalendar = (data: [], type: string) => {
    const createdData = data?.map((d: any) => {
      const title = type === 'rental' ? d.rentalJobName : type === 'planning' ? d.planningNumber : '- - -';
      const start = type === 'rental' ? new Date(d.estimateStartDate) : type === 'planning' ? new Date(d.startDate) : '- - -';
      const end = type === 'rental' ? new Date(d.estimateEndDate) : type === 'planning' ? new Date(d.endDate) : '- - -';

      return {
        id: d._id,
        title: title,
        start: start,
        end: end,
        allDay: true,
        type: type
      };
    });

    return createdData;
  };

  const fetchData = () => {
    const queryString = getQueryString();
    if (!queryString) {
      setEvents([]);
      return;
    }
    axiosInstance()
      .get(queryString)
      .then(({ data: { data } }) => {
        if (selectedRentalPlanningCalendarType === rentalPlanningCalendarType[1]) {
          const rental: any = [];
          const planning: any = [];
          data.forEach((item) => {
            rental.push(...item?.rental);
            planning.push(...item?.planning);
          });
          const rentalData = createDataForCalendar(rental, 'rental');
          const scheduleData = createDataForCalendar(planning, 'planning');
          setEvents([...rentalData, ...scheduleData]);
        } else {
          const rentalData = createDataForCalendar(data?.rental || [], 'rental');
          const scheduleData = createDataForCalendar(data?.planning || [], 'planning');
          setTotalEvents([...rentalData, ...scheduleData]);
          setStaticEvents([...rentalData, ...scheduleData]);
          setEvents([...rentalData, ...scheduleData]);
          setUpdateCount(updateCount + 1);
        }
      })
      .catch((err) => {});
  };

  const updateData = (event, start, end) => {
    let route = '';
    if (event.type === 'rental') {
      route = 'change-rental-date';
    } else if (event.type === 'planning') {
      route = 'change-planning-date';
    }
    axiosInstance()
      .put(`/rental-planning-calendar/${route}`, {
        _id: event.id,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        fetchData();
      });
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, selectedProduct, selectedAsset, dateRange, selectedRentalPlanningCalendarType]);

  useEffect(() => {
    if (selectedWarehouse.length > 0 || selectedProduct.length > 0 || selectedAsset.length > 0) {
      if (!filterToKeep.includes('warehouse')) {
        setSelectedWarehouse([]);
      }
      if (!filterToKeep.includes('product')) {
        setSelectedProduct([]);
      }
      if (!filterToKeep.includes('asset')) {
        setSelectedAsset([]);
      }
    }
  }, [filterToKeep]);

  const moveEvent = ({ event, start, end }) => {
    const filterEvents = staticEvents.filter((ev) => ev.id !== event.id);
    const existing = staticEvents.find((ev) => ev.id === event.id) ?? {};
    setEvents([...filterEvents, { ...existing, start, end }]);
    updateData(event, start, end);
  };

  const resizeEvent = ({ event, start, end }) => {
    const filterEvents = staticEvents.filter((ev) => ev.id !== event.id);
    const existing = staticEvents.find((ev) => ev.id === event.id) ?? {};
    setEvents([...filterEvents, { ...existing, start, end }]);
    updateData(event, start, end);
  };

  const onView = useCallback(
    (view) => {
      setView(view);
    },
    [setView]
  );

  useEffect(() => {
    if (renderCount !== 0) {
      if (view === 'month') {
        setDateRange({
          estimateStartDate: month.startDate,
          estimateEndDate: month.endDate
        });
      } else if (view === 'week') {
        setDateRange({
          estimateStartDate: week.startDate,
          estimateEndDate: week.endDate
        });
      } else if (view === 'day') {
        setDateRange({
          estimateStartDate: day.startDate,
          estimateEndDate: day.endDate
        });
      }
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [view]);

  const handleClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const handleCloseRentalPlanningCalendarType = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (anchorRef1.current && anchorRef1.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpenRentalPlanningCalendarType(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleToggleRentalPlanningCalendarType = () => {
    setOpenRentalPlanningCalendarType((prevOpen) => !prevOpen);
  };

  const filterEvent = () => {
    const option = selectedOption === options[1] ? 'rental' : selectedOption === options[2] ? 'planning' : null;
    if (option) {
      const filteredEvents = totalEvents.filter((item) => item.type === option);
      setEvents(filteredEvents);
    } else {
      setEvents(totalEvents);
    }
  };

  useEffect(() => {
    if (updateCount > 1) {
      filterEvent();
    }
  }, [updateCount]);

  useEffect(() => {
    filterEvent();
  }, [selectedOption]);

  return (
    <div>
      <Box display="flex" flexDirection={selectedRentalPlanningCalendarType === 'Assets' ? 'row' : 'column'}>
        <Box display="flex" flexDirection="row">
          <Box ml={1}>
            <ButtonGroup
              id="approveDisapprove"
              size="small"
              className={'accountActions'}
              variant="outlined"
              color="primary"
              ref={anchorRef1}
              aria-label="small outlined button group"
            >
              <Button style={{ minWidth: '85px', minHeight: 38 }}>{selectedRentalPlanningCalendarType}</Button>
              <Button
                color="primary"
                size="small"
                aria-controls={openRentalPlanningCalendarType ? 'split-button-menu' : undefined}
                aria-expanded={openRentalPlanningCalendarType ? 'true' : undefined}
                aria-label="select merge strategy"
                aria-haspopup="menu"
                onClick={handleToggleRentalPlanningCalendarType}
                className="all-button"
              >
                <ArrowDropDownIcon className="all-button-sub-icon" />
              </Button>
            </ButtonGroup>
            <Popper
              open={openRentalPlanningCalendarType}
              anchorEl={anchorRef1.current}
              role={undefined}
              transition
              disablePortal
              style={{ zIndex: 1111111 }}
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={handleCloseRentalPlanningCalendarType}>
                      <MenuList id="menu" style={{ backgroundColor: 'transparent', fontSize: '10px' }}>
                        {rentalPlanningCalendarType.map((option, index) => (
                          <MenuItem
                            key={option}
                            selected={option === selectedRentalPlanningCalendarType}
                            onClick={(event) => {
                              setSelectedRentalPlanningCalendarType(rentalPlanningCalendarType[index]);
                              setOpenRentalPlanningCalendarType(false);
                              setFilterToKeep([]);
                            }}
                            style={{ color: 'black' }}
                          >
                            {option}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          </Box>
          {selectedRentalPlanningCalendarType === rentalPlanningCalendarType[0] && (
            <Box ml={1}>
              <ButtonGroup
                id="approveDisapprove"
                size="small"
                className={'accountActions'}
                variant="outlined"
                color="primary"
                ref={anchorRef}
                aria-label="small outlined button group"
              >
                <Button style={{ minWidth: '85px', minHeight: 38 }}>{selectedOption}</Button>
                <Button
                  color="primary"
                  size="small"
                  aria-controls={open ? 'split-button-menu' : undefined}
                  aria-expanded={open ? 'true' : undefined}
                  aria-label="select merge strategy"
                  aria-haspopup="menu"
                  onClick={handleToggle}
                  className="all-button"
                >
                  <ArrowDropDownIcon className="all-button-sub-icon" />
                </Button>
              </ButtonGroup>
              <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal style={{ zIndex: 1111111 }}>
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    style={{
                      transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                    }}
                  >
                    <Paper>
                      <ClickAwayListener onClickAway={handleClose}>
                        <MenuList id="menu" style={{ backgroundColor: 'transparent', fontSize: '10px' }}>
                          {options.map((option, index) => (
                            <MenuItem
                              key={option}
                              selected={option === selectedOption}
                              onClick={(event) => {
                                setSelectedOption(options[index]);
                                setOpen(false);
                              }}
                              style={{ color: 'black' }}
                            >
                              {option}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </Box>
          )}
          {selectedRentalPlanningCalendarType === rentalPlanningCalendarType[0] && (
            <Box ml={1}>
              <Autocomplete
                style={{ width: '350px' }}
                multiple
                options={Object.keys(FILTERS)?.map((key) => key) || []}
                disableCloseOnSelect
                getOptionLabel={(option) => FILTERS[option]}
                renderOption={(option: any) => (
                  <React.Fragment>
                    <Checkbox checked={filterToKeep?.includes(option)} />
                    {FILTERS[option]}
                  </React.Fragment>
                )}
                size="small"
                renderInput={(params) => <TextField size={'small'} {...params} label="Filters" variant="outlined" />}
                value={filterToKeep}
                onChange={(event: any, newValue: any) => {
                  setFilterToKeep(newValue);
                }}
              />
            </Box>
          )}
        </Box>
        <Box display="flex" flexDirection="row" marginTop={selectedRentalPlanningCalendarType === 'Assets' ? '0px' : '15px'} ml={1}>
          <Grid container spacing={2}>
            {filterToKeep?.includes('warehouse') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={warehouse}
                  // style={{ width: "250px" }}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedWarehouse}
                  onChange={(event, newValue) => {
                    setSelectedWarehouse(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField size={'small'} {...params} label={`Select Plant`} variant="outlined" />}
                />
              </Grid>
            )}
            {filterToKeep?.includes('product') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={product}
                  // style={{ width: "250px" }}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedProduct}
                  onChange={(event, newValue) => {
                    setSelectedProduct(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField size={'small'} {...params} label={`Select Product`} variant="outlined" />}
                />
              </Grid>
            )}
            {(filterToKeep?.includes('asset') || selectedRentalPlanningCalendarType === 'Assets') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={asset}
                  style={{ minWidth: selectedRentalPlanningCalendarType === 'Assets' && '350px' }}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedAsset}
                  onChange={(event, newValue) => {
                    setSelectedAsset(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField size={'small'} {...params} label={`Select Asset`} variant="outlined" />}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
      <DragAndDropCalendar
        style={{ height: 'calc(100vh - 260px)' }}
        defaultDate={defaultDate}
        defaultView={'day'}
        events={events}
        formats={formats}
        localizer={localizer}
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        popup={true}
        resizable
        views={{ month: true, week: true, day: true }}
        onView={onView}
        view={view}
        eventPropGetter={(obj: any) => {
          const newStyles = {
            backgroundColor: obj.type === 'rental' ? 'rgba(255, 232, 204, 1)' : 'rgba(234, 239, 254, 1)',
            color: obj?.type === 'rental' ? 'rgba(236, 85, 0, 1)' : 'rgba(4, 50, 161, 1)',
            borderRadius: '4px',
            border: 'none',
            padding: '8px 16px'
          };
          return {
            style: newStyles
          };
        }}
        onNavigate={(date) => {
          if (view === 'month') {
            setDateRange({
              estimateStartDate: moment(date).startOf('month').format('MM/DD/YYYY'),
              estimateEndDate: moment(date).endOf('month').format('MM/DD/YYYY')
            });
          } else if (view === 'week') {
            setDateRange({
              estimateStartDate: moment(date).startOf('week').format('MM/DD/YYYY'),
              estimateEndDate: moment(date).endOf('week').format('MM/DD/YYYY')
            });
          } else if (view === 'day') {
            setDateRange({
              estimateStartDate: moment(date).format('MM/DD/YYYY'),
              estimateEndDate: moment(date).format('MM/DD/YYYY')
            });
          }
        }}
        onSelectEvent={(event: any) => {
          if (event.type === 'rental') {
            history.push(`${routes.rentalManagementDetail.path}/${event.id}`);
          } else if (event.type === 'planning') {
            history.push(`${routes.planningDetail.path}/${event.id}`);
          }
        }}
      />
    </div>
  );
}

export default CalendarView;
