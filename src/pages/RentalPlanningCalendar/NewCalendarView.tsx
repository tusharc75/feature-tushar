import { Box, Checkbox, Grid, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { View, momentLocalizer } from 'react-big-calendar';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import CustomCalendar from 'src/components/CustomCalendar';
import routes from 'src/components/Helpers/Routes';
import { RESOURCE_LABEL, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import './calendarView.scss';

const planningResource = [
  {
    resource: 'rentalManagement',
    path: routes.rentalManagementDetail.path,
    title: 'rentalJobName',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    resource: 'planning',
    path: routes.planningDetail.path,
    title: 'planningNumber',
    start: 'startDate',
    end: 'endDate'
  },
  {
    resource: 'demandOrder',
    path: routes.demandOrderDetail.path,
    title: 'demandOrderNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    resource: 'productionOrder',
    path: routes?.productionOrderDetail?.path,
    title: 'productionOrderNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    resource: 'purchaseRequisition',
    path: routes.purchaseRequisitionDetail.path,
    title: 'purchaseRequisitionNumber',
    start: 'createDate',
    end: 'estimateDeliveryDate'
  },
  {
    resource: 'purchaseOrder',
    path: routes.purchaseOrderDetail.path,
    title: 'purchaseOrderNumber',
    start: 'purchaseOrderDate',
    end: 'deliveryDate'
  },
  {
    resource: 'repairJob',
    path: routes.repairJobDetail.path,
    title: 'repairJobName',
    start: 'startDate',
    end: 'expectedCompletionDate'
  },
  {
    resource: 'sublease',
    path: routes.subleaseDetail.path,
    title: 'subleaseName',
    start: 'estimateStartDate',
    end: 'estimateEndDate'
  },
  {
    resource: 'projectSales',
    path: routes.projectSalesDetail.path,
    title: 'projectName',
    start: 'startDate',
    end: 'endDate'
  }
];

const localizer = momentLocalizer(moment);

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

function CalendarView() {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const [resource, setResource] = useState(null);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState<View>('month');
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

  const [agenda, setAgenda] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });

  const [renderCount, setRenderCount] = useState(0);
  const defaultDate = useMemo(() => moment().toDate(), []);

  const FILTERS = {
    warehouse: 'Plant',
    product: 'Product',
    asset: 'Asset'
  };

  const getMatchedResource = (value: string) => {
    const resource = planningResource.filter((_resource) => _resource.resource === value)[0];

    return resource;
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
    } else if (view === 'agenda') {
      setAgenda({
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

    if (resource) {
      query = `${query}&resource=${sidebarResource[resource]}`;
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
      query = `${query}&asset=${asset}`;
    }

    return query;
  };

  const createDataForCalendar = (data: []) => {
    const createdData = data?.map((d: any) => {
      const _resource = getMatchedResource(resource);

      return {
        id: d._id,
        title: d[_resource.title],
        start: d[_resource.start],
        end: d[_resource.end],
        allDay: true,
        type: resource
      };
    });
    return createdData;
  };

  const fetchData = () => {
    const queryString = getQueryString();
    axiosInstance()
      .get(queryString)
      .then(({ data: { data } }) => {
        const createdData = createDataForCalendar(data?.data || []);
        setEvents(createdData);
      })
      .catch((err) => {});
  };

  useEffect(() => {
    if (resource) {
      fetchData();
    }
  }, [resource, selectedWarehouse, selectedProduct, selectedAsset, dateRange]);

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

  const onView = useCallback(
    (view) => {
      setView(view);
    },
    [setView]
  );

  const clickableEventInListView = () => {
    const header = document.getElementsByClassName('rbc-header')[2];
    if (header) {
      header.innerHTML = RESOURCE_LABEL[resource];
    }

    const element: any = document.getElementsByClassName('rbc-agenda-event-cell');
    for (let i = 0; i < element?.length; i++) {
      element[i].onclick = () => {
        const event = events.filter((event) => event.title === element[i].innerText)[0];
        const path = getMatchedResource(event.type).path;
        history.push(`${path}/${event.id}`);
      };
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

  return (
    <div>
      <Box display="flex" flexDirection="column">
        <Box display="flex" flexDirection="row">
          <Box ml={1}>
            <Autocomplete
              options={planningResource?.map((_resource) => _resource.resource) || []}
              getOptionLabel={(option) => RESOURCE_LABEL[option] ?? ''}
              style={{ width: '350px' }}
              disableClearable
              value={resource}
              onChange={(event, newValue) => {
                setResource(newValue);
              }}
              size="small"
              renderInput={(params) => <TextField {...params} label="Select Resource" size="small" variant="outlined" />}
            />
          </Box>
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
              renderInput={(params) => <TextField {...params} label="Filters" variant="outlined" />}
              value={filterToKeep}
              onChange={(event: any, newValue: any) => {
                setFilterToKeep(newValue);
              }}
            />
          </Box>
        </Box>
        <Box display="flex" flexDirection="row" ml={1} mt={2}>
          <Grid container spacing={2}>
            {filterToKeep?.includes('warehouse') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={warehouse}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedWarehouse}
                  onChange={(event, newValue) => {
                    setSelectedWarehouse(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select Plant`} variant="outlined" />}
                />
              </Grid>
            )}
            {filterToKeep?.includes('product') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={product}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedProduct}
                  onChange={(event, newValue) => {
                    setSelectedProduct(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select Product`} variant="outlined" />}
                />
              </Grid>
            )}
            {filterToKeep?.includes('asset') && (
              <Grid item xs={12} sm={6} md={4} lg={4}>
                <Autocomplete
                  options={asset}
                  multiple
                  disableCloseOnSelect
                  getOptionLabel={(option: any) => option.optionLabel}
                  value={selectedAsset}
                  onChange={(event, newValue) => {
                    setSelectedAsset(newValue);
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select Asset`} variant="outlined" />}
                />
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>
      <div className="relative">
        <CustomCalendar
          style={{ height: 'calc(100vh - 260px)' }}
          defaultDate={defaultDate}
          defaultView={'day'}
          events={events}
          formats={formats}
          localizer={localizer}
          popup={true}
          messages={{
            agenda: 'List'
          }}
          views={['month', 'week', 'day', 'agenda']}
          onView={onView}
          view={view}
          eventPropGetter={(obj: any) => {
            const newStyles = {
              backgroundColor: 'rgba(234, 239, 254, 1)',
              color: 'rgba(4, 50, 161, 1)',
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
            } else if (view === 'agenda') {
              setDateRange({
                estimateStartDate: moment(date).format('MM/DD/YYYY'),
                estimateEndDate: moment(date).add(1, 'months').format('MM/DD/YYYY')
              });
            }
          }}
          onSelectEvent={(event: any) => {
            const path = getMatchedResource(event.type).path;
            history.push(`${path}/${event.id}`);
          }}
        />
      </div>
    </div>
  );
}

export default CalendarView;
