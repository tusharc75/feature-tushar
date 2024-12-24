import {
  Box,
  Checkbox,
  CircularProgress,
  IconButton,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';
import { camelCase, groupBy } from 'lodash';
import moment from 'moment';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { View, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import CustomCalendar from 'src/components/CustomCalendar';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, dateFormat, sidebarResource } from 'src/constants/helpers';
import { OnSelectDataType } from 'src/pages/PlanningView/Calendar/type';
import './calendarView.scss';
import CloseIcon from '@mui/icons-material/Close';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const localizer = momentLocalizer(moment);
const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

function CalendarView({ resourceList, selectedResource, setSelectedResource, setQueryString }, ref) {
  const {
    state: { permissions, resources }
  }: any = useData();

  const FILTERS = [
    ...(permissions?.warehouse?.isRead
      ? [
          {
            label: resources?.warehouse?.titlePlural,
            value: 'Warehouse',
            key: 'warehouse'
          }
        ]
      : []),
    ...(permissions?.product?.isRead
      ? [
          {
            label: resources?.product?.titlePlural,
            value: 'Product',
            key: 'product'
          }
        ]
      : []),
    ...(permissions?.serializedAsset?.isRead
      ? [
          {
            label: resources?.serializedAsset?.titlePlural,
            value: 'Serialized Asset',
            key: 'asset'
          }
        ]
      : []),
    ...(permissions?.serviceMaster?.isRead
      ? [
          {
            label: resources?.serviceMaster?.titlePlural,
            value: 'Service Master',
            key: 'service'
          }
        ]
      : []),
    ...(permissions?.customerAccount?.isRead
      ? [
          {
            label: resources?.customerAccount?.titlePlural,
            value: 'Customer Account',
            key: 'customerAccount'
          }
        ]
      : []),
    ...(permissions?.competencies?.isRead
      ? [
          {
            label: resources?.competencies?.titlePlural,
            value: 'Competencies',
            key: 'competencies'
          }
        ]
      : [])
  ];

  const ASSET_FILTERS = [
    {
      label: resources?.serializedAsset?.titlePlural,
      value: 'Serialized Asset',
      key: 'assetIds'
    }
  ];

  const PRODUCT_FILTERS = [
    {
      label: resources?.product?.titlePlural,
      value: 'Product',
      key: 'product'
    },
    {
      label: resources?.warehouse?.titlePlural,
      value: 'Warehouse',
      key: 'warehouse'
    }
  ];

  const RENTAL_JOB_FILTERS = [
    {
      label: resources?.rentalManagement?.titlePlural,
      value: 'Rental Management',
      key: 'rentalJob'
    },
    {
      label: resources?.padMaster?.titlePlural,
      value: 'Pad Master',
      key: 'padMaster'
    }
  ];

  const [themeMode] = useAppTheme();
  const toastConfig = useContext(CustomToastContext);
  const mobileView = isMobile && !isTablet;

  const [events, setEvents] = useState([]);
  const [view, setView] = useState<View>(mobileView ? 'day' : 'month');
  const [lookupResource, setLookUpResource] = useState(null);
  const [selectedLookUpResourceData, setSelectedLookUpResourceData] = useState(null);

  const [filters, setFilters] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const [renderCount, setRenderCount] = useState(0);
  const defaultDate = useMemo(() => moment().toDate(), []);

  const [staticEvents, setStaticEvents] = useState([]);

  const [dateRange, setDateRange] = useState({
    estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
  });

  const [month, setMonth] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [week, setWeek] = useState({
    startDate: moment().startOf('week').format('MM/DD/YYYY'),
    endDate: moment().endOf('week').format('MM/DD/YYYY')
  });
  const [day, setDay] = useState({
    startDate: moment().startOf('day').format('MM/DD/YYYY'),
    endDate: moment().endOf('day').format('MM/DD/YYYY')
  });

  const [agenda, setAgenda] = useState({
    startDate: moment().startOf('day').format('MM/DD/YYYY'),
    endDate: moment().add(1, 'months').format('MM/DD/YYYY')
  });

  const [isOpen, setOpen] = useState({ open: false, data: [], eventData: null });
  const [anchor, setAnchor] = useState(null);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(false);

  useImperativeHandle(ref, () => ({
    fetchData
  }));

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
    } else if (view === 'agenda') {
      setAgenda({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    }
  }, [dateRange]);

  useEffect(() => {
    let lookupResource = [...FILTERS, ...ASSET_FILTERS, ...PRODUCT_FILTERS, ...RENTAL_JOB_FILTERS]?.map((e) => e.value)?.toString();
    if (lookupResource) {
      setLookupLoading(true);
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setLookUpResource(data);
          setLookupLoading(false);
        })
        .catch((error) => {
          setLookupLoading(false);
          toastConfig.setToastConfig(error);
        });
    }
  }, []);

  useEffect(() => {
    if (selectedResource) {
      (async () => {
        if (selectedResource.resource === sidebarResource.planning) {
          const fieldData = await axiosInstance().get(`/field?resource=${selectedResource.resource}`);
          const categoryField = fieldData?.data?.data?.find((e) => e.fieldData.fieldName === 'category')?.fieldData;
          if (categoryField) {
            setFilters([
              ...FILTERS?.filter((e) => e.key !== 'asset'),
              {
                label: 'Category',
                value: 'Category',
                key: 'category'
              }
            ]);
            setLookUpResource((prevState) => ({ ...prevState, Category: categoryField?.option }));
          } else {
            setFilters(FILTERS?.filter((e) => e.key !== 'asset'));
          }
        } else if (selectedResource.resource === sidebarResource.serializedAsset) {
          setFilters(ASSET_FILTERS);
        } else if (selectedResource.resource === sidebarResource.product) {
          setFilters(PRODUCT_FILTERS);
        } else if (selectedResource.resource === sidebarResource.rentalManagement) {
          setFilters([...FILTERS, ...RENTAL_JOB_FILTERS]);
        } else {
          setFilters(FILTERS);
        }
      })();
    }
  }, [selectedResource]);

  useEffect(() => {
    setSelectedFilters([]);
    if (selectedResource?.resource === sidebarResource.serializedAsset) {
      setSelectedFilters(ASSET_FILTERS);
    } else if (selectedResource?.resource === sidebarResource.product) {
      setSelectedFilters(PRODUCT_FILTERS);
    }
    setSelectedLookUpResourceData(null);
  }, [selectedResource]);

  useEffect(() => {
    if (selectedResource) {
      fetchData();
    } else {
      setEvents([]);
    }
  }, [selectedResource, selectedLookUpResourceData, dateRange]);

  const getQueryString = () => {
    const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`;
    let query = `?date=${date}`;
    if (selectedResource) {
      query = `${query}&resource=${selectedResource.resource}`;
    }
    if (selectedLookUpResourceData) {
      Object.keys(selectedLookUpResourceData).forEach((d) => {
        const data = selectedLookUpResourceData[d]?.map((ele) => ele.optionValue)?.toString();
        query = `${query}&${d}=${data}`;
      });
    }
    return query;
  };

  const fetchData = () => {
    setIsDataFetching(true);
    const queryString = getQueryString();
    setQueryString(queryString);
    axiosInstance()
      .get(`/planning-view${queryString}`)
      .then(({ data: { data } }) => {
        const otherData = [];
        const rows = data?.map((d: any) => {
          if (selectedResource.resource === sidebarResource.serializedAsset) {
            return {
              id: d._id,
              title: d?.quotationNumber || d?.planningNumber || d?.rentalJobName,
              start: new Date(d['estimateStartDate'] || d['startDate']),
              end: new Date(d['estimateEndDate'] || d['endDate']),
              allDay: true,
              resource: d.resource,
              fulfillStatus: d?.fulfillStatus
            };
          }
          if (selectedResource.resource === sidebarResource.product) {
            for (const property in d) {
              if (property === 'debit') {
                if (d?.debit?.length) {
                  const debitQty = d?.debit.reduce((sum, row) => Number(row.qty) + sum, 0);
                  otherData.push({
                    title: `↓ Planned ${debitQty}`,
                    start: new Date(d['date']),
                    end: new Date(d['date']),
                    allDay: true,
                    resource: selectedResource.resource,
                    type: 'debit',
                    data: d?.debit
                    //isRedAlert: debitQty > d?.availableByPlanning ? true : false
                  });
                }
              } else if (property === 'credit') {
                if (d?.credit?.length) {
                  otherData.push({
                    title: `↑ Incoming ${d?.credit.reduce((sum, row) => Number(row.qty) + sum, 0)}`,
                    start: new Date(d['date']),
                    end: new Date(d['date']),
                    allDay: true,
                    resource: selectedResource.resource,
                    type: 'credit',
                    data: d?.credit
                  });
                }
              } else if (property === 'reserved') {
                if (d?.reserved?.length) {
                  otherData.push({
                    title: `Reserved ${d?.reserved.reduce((sum, row) => Number(row.qty) + sum, 0)}`,
                    start: new Date(d['date']),
                    end: new Date(d['date']),
                    allDay: true,
                    resource: selectedResource.resource,
                    type: 'reserved',
                    data: d?.reserved
                  });
                }
              } else if (property === 'inventory') {
                if (d?.inventory) {
                  otherData.push({
                    title: `Inventory ${d?.inventory}`,
                    start: new Date(d['date']),
                    end: new Date(d['date']),
                    allDay: true,
                    resource: selectedResource.resource
                  });
                }
              } else if (property === 'availableByPlanning') {
                otherData.push({
                  title: `Planned Available ${d?.availableByPlanning || 0}`,
                  start: new Date(d['date']),
                  end: new Date(d['date']),
                  allDay: true,
                  type: 'availableByPlanning',
                  resource: selectedResource.resource,
                  isRedAlert: d?.availableByPlanning < 0 ? true : false
                });
              } else if (['assetCount', 'date']?.includes(property)) {
              } else if (d[property]) {
                otherData.push({
                  title: `${property} ${d[property]}`,
                  start: new Date(d['date']),
                  end: new Date(d['date']),
                  allDay: true,
                  type: 'assetStatus',
                  status: property,
                  resource: selectedResource.resource
                });
              }
            }
          }
          let title = d[selectedResource.fieldName];
          let start = new Date(d[selectedResource.start]);
          let end = new Date(d[selectedResource.end]);
          let fulfillStatus = d?.fulfillStatus;
          let startDraggable = true;
          let endDraggable = true;

          if (selectedResource.resource === sidebarResource.rentalManagement) {
            if (d?.parentAccount?.optionLabel) {
              title = `${title} (Parent-${d?.parentAccount?.optionLabel})`;
            }
            if (d?.padName?.optionLabel) {
              title = `${title}(Pad-${d?.padName?.optionLabel})`;
            }
            if (d?.actualStartDate) {
              start = new Date(d?.actualStartDate);
              startDraggable = false;
            }
            if (d?.actualEndDate) {
              end = new Date(d?.actualEndDate);
              end.setHours(23, 59, 59, 999);
              endDraggable = false;
            }
            if (!d?.actualEndDate && moment(new Date()).isAfter(moment(d?.estimateEndDate))) {
              fulfillStatus = 'ERROR';
            }
          }
          return {
            id: d._id,
            title: title,
            start: start,
            end: end,
            allDay: true,
            resource: selectedResource.resource,
            fulfillStatus: fulfillStatus,
            startDraggable: startDraggable,
            endDraggable: endDraggable
          };
        });

        setEvents([...rows, ...otherData]);
        setStaticEvents([...rows, ...otherData]);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => setIsDataFetching(false));
  };

  useEffect(() => {
    if (selectedLookUpResourceData) {
      Object.keys(selectedLookUpResourceData).forEach((o) => {
        if (!selectedFilters.some((f) => f.key === o)) {
          const { [o]: _, ...remainObj } = selectedLookUpResourceData;
          setSelectedLookUpResourceData(remainObj);
        }
      });
    }
  }, [selectedFilters]);

  const clickableEventInListView = () => {
    const header = document.getElementsByClassName('rbc-header')[2];
    if (header) {
      header.innerHTML = selectedResource.title;
    }

    const element: any = document.getElementsByClassName('rbc-agenda-event-cell');
    for (let i = 0; i < element?.length; i++) {
      const spanElement = document.createElement('span');

      const content = element[i].textContent;
      element[i].textContent = '';

      spanElement.style.cursor = 'pointer';

      spanElement.textContent = content;
      element[i].appendChild(spanElement);

      element[i].onclick = (clickEvent) => {
        const data = events.filter((event) => event.title === element[i].innerText)[0];
        handleClick(data, clickEvent?.target);
      };
    }
  };

  const handleClick = (data, target) => {
    if (selectedResource.resource === sidebarResource.product) {
      if (data?.type === 'assetStatus') {
        let query = `?assetStatus=${data?.status}`;
        if (selectedLookUpResourceData?.product) {
          query += `&product=${encodeURIComponent(
            JSON.stringify(
              selectedLookUpResourceData?.product?.map((e) => {
                return { optionLabel: e?.optionLabel, optionValue: e?.optionValue };
              })
            )
          )}`;
        }
        if (selectedLookUpResourceData?.warehouse) {
          query += `&warehouse=${encodeURIComponent(
            JSON.stringify(
              selectedLookUpResourceData?.warehouse?.map((e) => {
                return { optionLabel: e?.optionLabel, optionValue: e?.optionValue };
              })
            )
          )}`;
        }
        window.open(`${routes.serializedAsset.path}${query}`);
      } else if (data?.type === 'availableByPlanning') {
      } else if (data?.type) {
        setAnchor(target);
        const newData: OnSelectDataType[] = data.data;
        setOpen({ open: true, data: mapObjectToList(groupBy(newData, 'resource')), eventData: data });
      }
    } else {
      if (data.resource) {
        const resource = resourceList?.find((r) => r.resource === data.resource);
        window.open(`${resource.path}/${data.id}`);
      } else {
        let path = selectedResource.path;
        if (selectedResource.resource === sidebarResource.serializedAsset) {
          path = routes[`${camelCase(data.resource)}Detail`]?.path;
        }
        window.open(`${path}/${data.id}`);
      }
    }
  };

  useEffect(() => {
    if (view === 'agenda') {
      clickableEventInListView();
    }
  }, [events]);

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
      } else if (view === 'agenda') {
        setDateRange({
          estimateStartDate: agenda.startDate,
          estimateEndDate: agenda.endDate
        });
      }
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [view]);

  const updateData = (event, start, end) => {
    axiosInstance()
      .put(`/planning-view/change-date`, {
        _id: event.id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        resource: event.resource
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

  const resize = (event, start, end) => {
    const filterEvents = staticEvents.filter((ev) => ev.id !== event.id);
    const existing = staticEvents.find((ev) => ev.id === event.id) ?? {};
    setEvents([...filterEvents, { ...existing, start, end }]);
    updateData(event, start, end);
  };

  const moveEvent = ({ event, start, end }) => {
    if (event?.resource === sidebarResource?.rentalManagement && !(event?.startDraggable && event?.endDraggable)) {
      toastConfig.setToastConfig({
        open: true,
        type: 'warning',
        message: `can't change start date or end date`
      });
    } else {
      resize(event, start, end);
    }
  };

  const resizeEvent = ({ event, start, end }) => {
    if (event?.resource === sidebarResource?.rentalManagement) {
      if (!event?.startDraggable && !moment(event?.start).isSame(moment(start))) {
        toastConfig.setToastConfig({
          open: true,
          type: 'warning',
          message: `can't change start date`
        });
      } else if (!event?.endDraggable && !moment(event?.end).isSame(moment(end))) {
        toastConfig.setToastConfig({
          open: true,
          type: 'warning',
          message: `can't change end date`
        });
      } else {
        resize(event, start, end);
      }
    } else {
      resize(event, start, end);
    }
  };

  const onNavigate = (date) => {
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
    } else if (view === 'agenda') {
      setDateRange({
        estimateStartDate: moment(date).format('MM/DD/YYYY'),
        estimateEndDate: moment(date).add(1, 'months').format('MM/DD/YYYY')
      });
    }
  };

  const setEventStyle = (obj) => {
    let backgroundColor = themeMode === 'light' ? 'rgb(234, 239, 254)' : 'rgb(185, 183, 219)';
    let color = '#000';

    if (obj?.resource === sidebarResource.planning) {
      if (obj?.fulfillStatus === 'Yes') {
        backgroundColor = themeMode === 'light' ? 'rgb(207, 244, 168)' : '#048e0a';
        color = themeMode === 'light' ? 'rgb(7, 61, 1)' : 'white';
      } else if (obj?.fulfillStatus === 'No') {
        backgroundColor = themeMode === 'light' ? 'rgb(255, 204, 204)' : 'rgb(156 1 22)';
        color = themeMode === 'light' ? 'rgb(203 0 0)' : 'white';
      } else if (obj?.fulfillStatus === 'Partially') {
        backgroundColor = themeMode === 'light' ? 'rgb(255 236 204)' : 'rgb(217 138 42)';
        color = themeMode === 'light' ? 'rgb(255 92 0)' : 'white';
      }
    }
    if (obj?.resource === sidebarResource.product) {
      if (obj?.type === 'credit') {
        backgroundColor = 'var(--success-light) ';
      } else if (obj?.type === 'reserved') {
        backgroundColor = 'var(--warning-light)';
      } else if (obj?.type === 'availableByPlanning' && obj?.isRedAlert) {
        backgroundColor = 'var(--danger-light)';
        color = 'white';
      } else if (obj?.type === 'debit' && obj?.isRedAlert) {
        backgroundColor = 'var(--danger-light)';
        color = 'white';
      } else if (obj?.type === 'debit') {
        backgroundColor = themeMode === 'light' ? 'rgb(255 236 204)' : 'rgb(217 138 42)';
      }
    }

    if (obj?.resource === sidebarResource.rentalManagement) {
      if (obj?.fulfillStatus === 'ERROR') {
        backgroundColor = 'rgb(220, 53, 69)';
        color = 'white';
      }
    }

    return {
      backgroundColor,
      color,
      borderRadius: '4px',
      border: 'none',
      padding: '8px 16px'
    };
  };

  const renderFilter = (filtered) => {
    return (
      <Autocomplete
        options={lookupResource ? lookupResource[filtered?.value] : []}
        multiple
        disableCloseOnSelect
        style={{ width: '300px' }}
        getOptionLabel={(option: any) => option?.optionLabel}
        value={selectedLookUpResourceData && selectedLookUpResourceData[filtered.key] ? selectedLookUpResourceData[filtered.key] : []}
        onChange={(event, newValue) => {
          if (newValue?.length > 0) {
            setSelectedLookUpResourceData((preVal) => ({
              ...preVal,
              [filtered.key]: newValue
            }));
          } else {
            const { [filtered.key]: _, ...remainObj } = selectedLookUpResourceData;
            setSelectedLookUpResourceData(remainObj);
          }
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select ${filtered?.label}`}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {lookupLoading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
          />
        )}
      />
    );
  };

  const mapObjectToList = (obj: { [key: string]: OnSelectDataType[] }) => {
    const data: { items: OnSelectDataType[]; key: string; heading: string }[] = [];
    for (const key in obj) {
      data.push({
        items: obj[key],
        key: key,
        heading: routes[camelCase(key)].title || key
      });
    }
    return data;
  };

  return (
    <>
      <div>
        <Box display="flex" flexDirection="column">
          <div className="flex flex-wrap gap-2 max-[560px]:pt-[40px] min-[561px]:pr-[100px]">
            <Autocomplete
              options={resourceList}
              getOptionLabel={(option) => (option && option?.title) || ''}
              style={{ width: '300px' }}
              value={selectedResource}
              onChange={(event, newValue) => {
                setSelectedResource(newValue);
              }}
              size="small"
              renderInput={(params) => <TextField {...params} label="Select Resource" size="small" variant="outlined" />}
            />
            {![sidebarResource.serializedAsset, sidebarResource.product].includes(selectedResource?.resource) && (
              <Autocomplete
                multiple
                options={filters}
                disableCloseOnSelect
                style={{ width: '300px' }}
                getOptionLabel={(option) => option?.label}
                renderOption={(option: any) => (
                  <React.Fragment>
                    <Checkbox checked={selectedFilters?.some((_s) => _s.key === option.key)} />
                    {option?.label}
                  </React.Fragment>
                )}
                size="small"
                renderInput={(params) => <TextField {...params} label="Filters" variant="outlined" />}
                value={selectedFilters}
                onChange={(event: any, newValue: any) => {
                  setSelectedFilters(newValue);
                }}
              />
            )}
            {[sidebarResource.serializedAsset, sidebarResource.product].includes(selectedResource?.resource) &&
              selectedFilters?.map((filtered) => {
                return renderFilter(filtered);
              })}
          </div>
          <Box display="flex" flexDirection="row" className="gap-1" ml={1} mt={2}>
            {![sidebarResource.serializedAsset, sidebarResource.product].includes(selectedResource?.resource) &&
              selectedFilters?.map((filtered) => {
                return renderFilter(filtered);
              })}
          </Box>
        </Box>
        <div className={cn('relative')}>
          {selectedResource?.resource === sidebarResource.rentalManagement || selectedResource?.resource === sidebarResource.planning ? (
            <>
              <CustomCalendar
                dragAndDrop={true}
                defaultDate={defaultDate}
                defaultView={'month'}
                events={events}
                formats={formats}
                localizer={localizer}
                onEventDrop={moveEvent}
                loading={isDataFetching}
                onEventResize={resizeEvent}
                popup={!mobileView}
                messages={{
                  agenda: 'List'
                }}
                resizable
                views={['month', 'week', 'day', 'agenda']}
                onView={setView}
                view={view}
                eventPropGetter={(obj: any) => {
                  const style = setEventStyle(obj);
                  return {
                    style
                  };
                }}
                onNavigate={(date) => {
                  onNavigate(date);
                }}
                onSelectEvent={(event: any) => {
                  window.open(`${selectedResource.path}/${event.id}`);
                }}
              />
            </>
          ) : (
            <div className="relative min-h-[500px] ">
              <CustomCalendar
                defaultDate={defaultDate}
                defaultView={'month'}
                events={events}
                formats={formats}
                localizer={localizer}
                loading={isDataFetching}
                popup={!mobileView}
                messages={{
                  agenda: 'List'
                }}
                views={['month', 'week', 'day', 'agenda']}
                onView={setView}
                view={view}
                eventPropGetter={(obj: any) => {
                  const style = setEventStyle(obj);
                  return {
                    style
                  };
                }}
                onNavigate={(date) => {
                  onNavigate(date);
                }}
                onSelectEvent={(data: any, event: any) => {
                  handleClick(data, event.nativeEvent.target);
                }}
              />
            </div>
          )}
        </div>
        {isOpen.open && (
          <Popover
            open={isOpen.open}
            anchorEl={anchor}
            onClose={() => {
              setOpen({ open: false, data: [], eventData: null });
            }}
            style={{ minWidth: '300px' }}
          >
            <Box className="max-h-[600px] space-y-2  overflow-y-auto overflow-x-hidden p-2">
              <div className="flex items-center justify-between pb-1 pr-1 pt-1">
                <h5 className="text-sm">{`${isOpen?.eventData?.title} - ${moment(isOpen?.eventData?.start).format(dateFormat)}`}</h5>
                <HtmlTooltip title="Close">
                  <IconButton size="small" onClick={() => setOpen({ open: false, data: [], eventData: null })} className="close-icon-v1">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </div>
              {isOpen.data?.map((d) => (
                <Accordion key={d.key} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <h6 className=" text-sm font-semibold">{d.heading}</h6>
                  </AccordionSummary>
                  <AccordionDetails>
                    <RenderTable data={d.items} resources={resources} />
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Popover>
        )}
      </div>
    </>
  );
}

export default forwardRef(CalendarView);

const RenderTable = ({ data, resources }) => {
  return (
    <TableContainer>
      <Table className="min-w-[530px]" aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Reference</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>{resources?.warehouse?.titleSingular}</TableCell>
            <TableCell>{resources?.customerAccount?.titleSingular}</TableCell>
            {data?.find((e) => e?.padName) && <TableCell>Pad Name</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.referenceId}>
              <TableCell component="th" scope="row">
                <p
                  onClick={() => {
                    if (row?.resource === sidebarResource.rentalManagement) {
                      window.open(`${routes.rentalManagementDetail.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.purchaseOrder) {
                      window.open(`${routes.purchaseOrderDetail.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.purchaseRequisition) {
                      window.open(`${routes.purchaseRequisitionDetail.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.productionOrder) {
                      window.open(`${routes?.productionOrderDetail?.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.demandOrder) {
                      window.open(`${routes.demandOrderDetail.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.repairOrder) {
                      window.open(`${routes?.repairOrderDetail?.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.repairJob) {
                      window.open(`${routes.repairJobDetail.path}/${row.referenceId}`);
                    } else if (row?.resource === sidebarResource.salesOrder) {
                      window.open(`${routes.salesOrderDetail.path}/${row.referenceId}`);
                    }
                  }}
                  className="link text-truncate"
                  title={row?.resourceLabel}
                >
                  {row.resourceLabel}
                </p>
              </TableCell>
              <TableCell component="th" scope="row">
                {row.qty}
              </TableCell>
              <TableCell component="th" scope="row">
                {row?.warehouse?.optionLabel}
              </TableCell>
              <TableCell component="th" scope="row">
                {row?.customerAccount?.optionLabel ? row?.customerAccount?.optionLabel : <NoDataCell />}
              </TableCell>
              {data?.find((e) => e?.padName) && (
                <TableCell component="th" scope="row">
                  {row?.padName?.optionLabel ? row?.padName?.optionLabel : <NoDataCell />}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
