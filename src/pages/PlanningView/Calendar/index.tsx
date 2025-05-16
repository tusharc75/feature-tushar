import { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { EventResizeDoneArg } from '@fullcalendar/interaction';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { Box, IconButton, Popover, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import axios, { CancelToken } from 'axios';
import dayjs from 'dayjs';
import { camelCase, groupBy, isEmpty } from 'lodash';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { isMobile, isTablet } from 'react-device-detect';
import { MdFilterList } from 'react-icons/md';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import CustomCalendar from 'src/components/CustomCalendar';
import { View } from 'src/components/CustomCalendar/types';
import { createFilterSetData } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { InfoSidebarButton, planningViewActions } from 'src/components/InfoSidebar';
import { cn, displayDate, sidebarResource } from 'src/constants/helpers';
import DetailsPopover from 'src/pages/PlanningView/Calendar/DetailsPopover';
import PlannedIncomingDialog from 'src/pages/PlanningView/Calendar/PlannedIncomingDialog';
import RenderFilter from 'src/pages/PlanningView/Calendar/RenderFilter';
import { getColorByIndex, SingleColor } from 'src/pages/PlanningView/Calendar/colorMap';
import { OnSelectDataType } from 'src/pages/PlanningView/Calendar/type';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';

function CalendarView({ resourceList, selectedResource, setSelectedResource, setQueryString, resourcePolicy }, ref) {
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const mapObjectToList = useCallback(
    (obj: { [key: string]: OnSelectDataType[] }) => {
      const data: { items: OnSelectDataType[]; key: string; heading: string }[] = [];
      for (const key in obj) {
        data.push({
          items: obj[key],
          key: key,
          heading: resources?.[camelCase(key)]?.titlePlural || key
        });
      }
      return data;
    },
    [resources]
  );

  const ASSET_FILTERS = useMemo(
    () => [
      {
        label: resources?.serializedAsset?.titlePlural,
        value: 'Serialized Asset',
        key: 'assetIds'
      }
    ],
    [resources?.serializedAsset?.titlePlural]
  );

  const PRODUCT_FILTERS = useMemo(
    () => [
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
    ],
    [resources?.product?.titlePlural, resources?.warehouse?.titlePlural]
  );

  const EMPLOYEE_MASTER_FILTERS = useMemo(
    () => [
      {
        label: resources?.employeeMaster?.titleSingular,
        value: 'Employee Master',
        key: 'technician'
      },
      {
        label: resources?.warehouse?.titlePlural,
        value: 'Warehouse',
        key: 'warehouse'
      }
    ],
    [resources?.product?.titlePlural, resources?.warehouse?.titlePlural]
  );

  const toastConfig = useContext(CustomToastContext);
  const mobileView = isMobile && !isTablet;
  const [events, setEvents] = useState([]);
  const [view, setView] = useState<View>(mobileView ? 'timeGridDay' : 'dayGridMonth');
  const [lookupResource, setLookUpResource] = useState(null);
  const [selectedLookUpResourceData, setSelectedLookUpResourceData] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [staticEvents, setStaticEvents] = useState([]);

  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
  });

  const [isOpen, setOpen] = useState({ open: false, data: [], eventData: null });
  const [anchor, setAnchor] = useState(null);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [showDetail, setShowDetail] = useState({ open: false, data: null, anchor: null });
  const [showPlannedIncoming, setShowPlannedIncoming] = useState(false);
  const [fields, setFields] = useState([]);
  const [resourceDatas, setResourceDatas] = useState([]);

  const [customerColorCodeMap, setCustomerColorCodeMap] = useState<Map<string, SingleColor>>(new Map());
  const [supplierColorCodeMap, setSupplierColorCodeMap] = useState<Map<string, SingleColor>>(new Map());

  const [showFilters, setShowFilters] = useState(false);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [deepFilters, setDeepFilters] = useState([]);
  const [filterByIds, setFilterByIds] = useState([]);
  const [filterTerm, setFilterTerm] = useState({});
  const [userFilters, setUserFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const CUSTOM_FILTERS = useMemo(
    () => [
      ...(permissions?.product?.isRead
        ? [
          {
            fieldData: {
              _id: '630dc2429ec41869152396b1',
              fieldName: 'product',
              fieldLabel: resources?.product?.titlePlural,
              lookup: true,
              lookupResource: sidebarResource.product,
              resource: selectedResource?.resource,
              type: 'dropDown',
              order: 100,
              required: false,
              sectionName: 'Material Handeling Filter',
              isTooltip: false,
              editAble: false,
              brand: user?.user?.brand,
              roleType: 0,
              sectionProperties: ''
            },
            isRead: true,
            isCreate: true,
            isUpdate: true
          }
        ]
        : []),
      ...(permissions?.serializedAsset?.isRead
        ? [
          {
            fieldData: {
              _id: '630dc2429ec41869252396b1',
              fieldName: 'asset',
              fieldLabel: resources?.serializedAsset?.titlePlural,
              lookup: true,
              lookupResource: sidebarResource.serializedAsset,
              resource: selectedResource?.resource,
              type: 'dropDown',
              order: 101,
              required: false,
              sectionName: 'Material Handeling Filter',
              isTooltip: false,
              editAble: false,
              brand: user?.user?.brand,
              roleType: 0,
              sectionProperties: ''
            },
            isRead: true,
            isCreate: true,
            isUpdate: true
          }
        ]
        : []),
      ...(permissions?.serviceMaster?.isRead
        ? [
          {
            fieldData: {
              _id: '630dc2429ec41869352396b1',
              fieldName: 'service',
              fieldLabel: resources?.serviceMaster?.titlePlural,
              lookup: true,
              lookupResource: sidebarResource.serviceMaster,
              resource: selectedResource?.resource,
              type: 'dropDown',
              order: 102,
              required: false,
              sectionName: 'Material Handeling Filter',
              isTooltip: false,
              editAble: false,
              brand: user?.user?.brand,
              roleType: 0,
              sectionProperties: ''
            },
            isRead: true,
            isCreate: true,
            isUpdate: true
          }
        ]
        : []),
      ...(permissions?.competencies?.isRead
        ? [
          {
            fieldData: {
              _id: '630dc2429ec41869452396b1',
              fieldName: 'competencies',
              fieldLabel: resources?.competencies?.titlePlural,
              lookup: true,
              lookupResource: sidebarResource.competencies,
              resource: selectedResource?.resource,
              type: 'dropDown',
              order: 103,
              required: false,
              sectionName: 'Material Handeling Filter',
              isTooltip: false,
              editAble: false,
              brand: user?.user?.brand,
              roleType: 0,
              sectionProperties: ''
            },
            isRead: true,
            isCreate: true,
            isUpdate: true
          }
        ]
        : [])
    ],
    [
      permissions?.competencies?.isRead,
      permissions?.product?.isRead,
      permissions?.serializedAsset?.isRead,
      permissions?.serviceMaster?.isRead,
      resources?.competencies?.titlePlural,
      resources?.product?.titlePlural,
      resources?.serializedAsset?.titlePlural,
      resources?.serviceMaster?.titlePlural,
      selectedResource?.resource
    ]
  );

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.customerAccount},${sidebarResource.supplierAccount}`)
      .then(({ data: { data } }) => {
        const newMapCustomer = new Map<string, SingleColor>();
        data[sidebarResource.customerAccount]?.forEach((ele, i) => {
          newMapCustomer.set(ele?.optionValue, getColorByIndex(i));
        });
        setCustomerColorCodeMap(newMapCustomer);

        const newMapSupplier = new Map<string, SingleColor>();
        data[sidebarResource.supplierAccount]?.forEach((ele, i) => {
          newMapSupplier.set(ele?.optionValue, getColorByIndex(i));
        });
        setSupplierColorCodeMap(newMapSupplier);
      })
      .catch((err) => toastConfig.setToastConfig(err));
  }, []);

  useEffect(() => {
    const lookupResource = [...new Set([...ASSET_FILTERS, ...PRODUCT_FILTERS, ...EMPLOYEE_MASTER_FILTERS]?.map((e) => e.value))]?.toString();
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
    setSelectedFilters([]);
    if (selectedResource?.resource === sidebarResource.serializedAsset) {
      setSelectedFilters(ASSET_FILTERS);
    } else if (selectedResource?.resource === sidebarResource.product) {
      setSelectedFilters(PRODUCT_FILTERS);
    } else if (selectedResource?.resource === sidebarResource.employeeMaster) {
      setSelectedFilters(EMPLOYEE_MASTER_FILTERS);
    }
    setSelectedLookUpResourceData(null);
  }, [selectedResource]);

  const getQueryString = useCallback(
    (deepFiltersP = deepFilters, filterByIdsP = filterByIds, filterTermP = filterTerm) => {
      const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`;
      let query = `?date=${date}`;
      if (selectedResource) {
        query = `${query}&resource=${selectedResource.resource}`;
      }
      if (selectedLookUpResourceData) {
        Object.keys(selectedLookUpResourceData).forEach((d) => {
          let data = [];
          if (d === 'technician') {
            data = selectedLookUpResourceData[d]?.map((ele) => ele.technician)?.toString();
          } else {
            data = selectedLookUpResourceData[d]?.map((ele) => ele.optionValue)?.toString();
          }
          query = `${query}&${d}=${data}`;
        });
      }
      if (filterByIdsP?.length > 0) {
        const filterById = filterByIdsP
          ?.filter((f) => {
            if (typeof f?.term === 'object') return !isEmpty(f?.term);
            return Array.isArray(f?.term) && f?.term?.length > 0;
          })
          ?.map((f) => {
            const term = filterTerm[f?.field] === '$nin' ? '$nin' : '$in';
            if (Array.isArray(f?.term)) {
              return {
                field: f?.field,
                term: {
                  [term]: f?.term?.map?.((d: any) => d.optionValue)
                }
              };
            }
            if (term === '$nin') {
              return {
                field: f?.field,
                term: {
                  ['$nin']: [f?.term?.optionValue]
                }
              };
            }
            return {
              field: f?.field,
              term: f?.term?.optionValue
            };
          });
        if (filterById?.length > 0) {
          query = `${query}&filterById=${JSON.stringify(filterById)}`;
        }
      }
      let deepFilter = [];
      if (deepFiltersP?.length > 0) {
        deepFilter = [
          ...deepFilter,
          ...deepFiltersP
            ?.filter((d) => {
              if (d?.type === 'date') {
                if (d?.duration === 'custom')
                  return (
                    (dayjs(d?.term?.from).isValid() && d?.term?.from instanceof Date) || (dayjs(d?.term?.to).isValid() && d?.term?.to instanceof Date)
                  );
                else
                  return (
                    dayjs(d?.term?.from).isValid() && d?.term?.from instanceof Date && dayjs(d?.term?.from).isValid() && d?.term?.from instanceof Date
                  );
              }
              return d?.term?.length ? true : false;
            })
            ?.map((d) => {
              if (d?.type === 'date') {
                return {
                  field: d?.field,
                  term: {
                    ...(d?.term?.from ? { from: d?.term?.from } : {}),
                    ...(d?.term?.to ? { to: d?.term?.to } : {})
                  }
                };
              }
              if (filterTerm[d?.field] === '$nin' && Array.isArray(d?.term)) {
                return {
                  field: d?.field,
                  term: { $nin: d?.term }
                };
              }
              return {
                field: d?.field,
                term: d?.term
              };
            })
        ];
      }
      if (deepFilter?.length) {
        query = `${query}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilter))}`;
      }
      query = `${query}&filterType=and`;
      return query;
    },
    [dateRange?.estimateEndDate, dateRange?.estimateStartDate, selectedLookUpResourceData, selectedResource, deepFilters, filterByIds, filterTerm]
  );

  const setEventStyle = useCallback(
    (obj, themeMode: 'dark' | 'light') => {
      let backgroundColor = themeMode === 'light' ? 'rgb(234, 239, 254)' : 'rgb(185, 183, 219)';
      let color = '#000000',
        textColor = '#000000';

      if (obj?.resource === sidebarResource.planning) {
        if (obj?.fulfillStatus === 'Yes') {
          backgroundColor = themeMode === 'light' ? 'rgb(207, 244, 168)' : '#048e0a';
          color = themeMode === 'light' ? 'rgb(7, 61, 1)' : 'white';
          textColor = themeMode === 'light' ? 'rgb(7, 61, 1)' : 'white';
        } else if (obj?.fulfillStatus === 'No') {
          backgroundColor = themeMode === 'light' ? 'rgb(255, 204, 204)' : 'rgb(156 1 22)';
          color = themeMode === 'light' ? 'rgb(203 0 0)' : 'white';
          textColor = themeMode === 'light' ? 'rgb(203 0 0)' : 'white';
        } else if (obj?.fulfillStatus === 'Partially') {
          backgroundColor = themeMode === 'light' ? 'rgb(255 236 204)' : 'rgb(217 138 42)';
          color = themeMode === 'light' ? 'rgb(255 92 0)' : 'white';
          textColor = themeMode === 'light' ? 'rgb(255 92 0)' : 'white';
        }
      }
      if (obj?.resource === sidebarResource.product) {
        if (obj?.type === 'credit') {
          backgroundColor = 'var(--success-light) ';
        } else if (obj?.type === 'availableByPlanning' && obj?.isRedAlert) {
          backgroundColor = 'var(--danger-light)';
          color = 'white';
          textColor = 'white';
        } else if (obj?.type === 'debit' && obj?.isRedAlert) {
          backgroundColor = 'var(--danger-light)';
          color = 'white';
          textColor = 'white';
        } else if (obj?.type === 'debit') {
          backgroundColor = themeMode === 'light' ? 'rgb(255 236 204)' : 'rgb(217 138 42)';
        }
      }

      if (
        (obj?.customerAccount || obj?.supplierAccount) &&
        ![sidebarResource.planning, sidebarResource.product, sidebarResource.serializedAsset]?.includes(obj?.resource)
      ) {
        const assignedColor = obj?.customerAccount ? customerColorCodeMap.get(obj?.customerAccount) : supplierColorCodeMap.get(obj?.supplierAccount);
        if (assignedColor) {
          backgroundColor = themeMode === 'light' ? assignedColor.light.bg : assignedColor.dark.bg;
          color = themeMode === 'light' ? assignedColor.light.text : assignedColor.dark.text;
          textColor = themeMode === 'light' ? assignedColor.light.text : assignedColor.dark.text;
        }
      }
      if (obj?.resource === sidebarResource.rentalManagement) {
        if (obj?.fulfillStatus === 'ERROR') {
          backgroundColor = 'rgb(220, 53, 69)';
          color = 'white';
          textColor = 'white';
        }
      }

      return {
        backgroundColor,
        textColor,
        color,
        border: 0,
        borderColor: 'var(--common-border-color)'
      };
    },
    [customerColorCodeMap, supplierColorCodeMap]
  );

  const fetchData = useCallback(
    (cancelToken?: CancelToken, deepFiltersP = deepFilters, filterByIdsP = filterByIds, filterTermP = filterTerm) => {
      setIsDataFetching(true);
      const queryString = getQueryString(deepFiltersP, filterByIdsP, filterTermP);
      setQueryString(queryString);
      axiosInstance()
        .get(`/planning-view${queryString}`, { cancelToken })
        .then(({ data: { data } }) => {
          setResourceDatas(data);
          const otherData = [];
          let rows = data?.map((d: any) => {
            if (selectedResource.resource === sidebarResource.serializedAsset) {
              return {
                id: d._id,
                title: d?.quotationNumber || d?.planningNumber || d?.rentalJobName,
                start: dayjs
                  .utc(d['estimateStartDate'] || d['startDate'])
                  .tz()
                  .toDate(),
                end: dayjs
                  .utc(d['estimateEndDate'] || d['endDate'])
                  .tz()
                  .endOf('day')
                  .toDate(),
                allDay: true,
                resource: d.resource,
                fulfillStatus: d?.fulfillStatus
              };
            }
            if (selectedResource.resource === sidebarResource.product) {
              const today = dayjs.tz();
              for (const property in d) {
                const ledgerDate = dayjs.utc(d['date']).tz();
                if (
                  resourcePolicy?.hideBackDatedPlanning &&
                  ledgerDate.isBefore(today, 'day') &&
                  ['debit', 'credit', 'availableByPlanning']?.includes(property)
                ) {
                } else if (property === 'debit') {
                  if (d?.debit?.length) {
                    const debitQty = d?.debit.reduce((sum, row) => Number(row.qty) + sum, 0);
                    otherData.push({
                      title: `↓ Planned ${debitQty}`,
                      start: dayjs.utc(d['date']).tz().toDate(),
                      end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                      allDay: true,
                      resource: selectedResource.resource,
                      type: 'debit',
                      data: d?.debit
                    });
                  }
                } else if (property === 'credit') {
                  if (d?.credit?.length) {
                    otherData.push({
                      title: `↑ Incoming ${d?.credit.reduce((sum, row) => Number(row.qty) + sum, 0)}`,
                      start: dayjs.utc(d['date']).tz().toDate(),
                      end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                      allDay: true,
                      resource: selectedResource.resource,
                      type: 'credit',
                      data: d?.credit
                    });
                  }
                } else if (property === 'availableByPlanning') {
                  otherData.push({
                    title: `Planned Available ${d?.availableByPlanning || 0}`,
                    start: dayjs.utc(d['date']).tz().toDate(),
                    end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                    allDay: true,
                    type: 'availableByPlanning',
                    resource: selectedResource.resource,
                    isRedAlert: d?.availableByPlanning < 0 ? true : false
                  });
                } else if (property === 'inventory') {
                  if (d?.inventory) {
                    otherData.push({
                      title: `Inventory ${d?.inventory}`,
                      start: dayjs.utc(d['date']).tz().toDate(),
                      end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                      allDay: true,
                      resource: selectedResource.resource
                    });
                  }
                } else if (['date']?.includes(property)) {
                } else if (property === 'assetCount') {
                  if (d[property]) {
                    if (resourcePolicy?.hideAssetStatusForFutureDates && ledgerDate.isAfter(today, 'day')) {
                    } else {
                      otherData.push({
                        title: `Total Assets ${d[property]}`,
                        start: dayjs.utc(d['date']).tz().toDate(),
                        end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                        allDay: true,
                        type: 'assetCount',
                        status: property,
                        resource: selectedResource.resource
                      });
                    }
                  }
                } else if (d[property]) {
                  if (resourcePolicy?.hideAssetStatusForFutureDates && ledgerDate.isAfter(today, 'day')) {
                  } else {
                    otherData.push({
                      title: `${property} ${d[property]}`,
                      start: dayjs.utc(d['date']).tz().toDate(),
                      end: dayjs.utc(d['date']).tz().endOf('day').toDate(),
                      allDay: true,
                      type: 'assetStatus',
                      status: property,
                      resource: selectedResource.resource
                    });
                  }
                }
              }
              return null;
            }
            let title = d[selectedResource.fieldName];
            let start = dayjs.utc(d[selectedResource.start]).tz().toDate();
            let end = dayjs.utc(d[selectedResource.end]).tz().endOf('day').toDate();
            let fulfillStatus = d?.fulfillStatus;

            const extraData: any = {};
            if (selectedResource.resource === sidebarResource.rentalManagement) {
              if (d?.parentAccount?.optionLabel) {
                title = `${title} (Parent-${d?.parentAccount?.optionLabel})`;
              }
              if (d?.padName?.optionLabel) {
                title = `${title}(Pad-${d?.padName?.optionLabel})`;
              }
              if (!d?.actualEndDate && dayjs.tz().isAfter(dayjs(d?.estimateEndDate))) {
                fulfillStatus = 'ERROR';
              }
              extraData.customerAccount = d?.customerAccount?.optionValue;
            } else if (d?.customerAccount?.optionLabel) {
              title = `${title} (${d?.customerAccount?.optionLabel})`;
              extraData.customerAccount = d?.customerAccount?.optionValue;
            } else if (d?.supplierAccount?.optionLabel) {
              title = `${title} (${d?.supplierAccount?.optionLabel})`;
              extraData.supplierAccount = d?.supplierAccount?.optionValue;
            }

            if (selectedResource.resource === sidebarResource.employeeMaster) {
              title = `${d?.reference?.optionLabel} ${d?.service ? `(${d?.service?.optionLabel})` : ''} - ${d?.technician?.optionLabel}`;
              extraData.referenceType = d?.referenceType;
              extraData.referenceId = d?.reference?.optionValue;
            }
            return {
              id: d?._id,
              title: title,
              start: start,
              end: end,
              ...(!isEmpty(extraData) ? extraData : {}),
              allDay: true,
              resource: selectedResource.resource,
              fulfillStatus: fulfillStatus
            };
          });
          rows = rows?.filter((e) => e);
          setEvents([...rows, ...otherData]);
          setStaticEvents([...rows, ...otherData]);
          setIsDataFetching(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          if (cancelToken?.reason.message !== 'Operation canceled due to new request.') {
            setIsDataFetching(false);
          }
        });
    },
    [
      getQueryString,
      selectedResource?.end,
      selectedResource?.fieldName,
      selectedResource?.resource,
      selectedResource?.start,
      setQueryString,
      toastConfig,
      deepFilters,
      filterByIds
    ]
  );

  useImperativeHandle(ref, () => ({
    fetchData
  }));

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

  const handleClick = useCallback(
    (args: EventClickArg) => {
      const data = { ...args.event, ...args.event.extendedProps } as any;
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
          setAnchor(args.el);
          const newData: OnSelectDataType[] = data.data;
          setOpen({ open: true, data: mapObjectToList(groupBy(newData, 'resource')), eventData: data });
        }
      } else if (selectedResource.resource === sidebarResource.employeeMaster) {
        if (data?.referenceType === sidebarResource.fieldTicket) {
          window.open(`${routes.fieldTicketDetail.path}/${data?.referenceId}`);
        } else if (data?.referenceType === sidebarResource.fieldServiceOrder) {
          window.open(`${routes.fieldServiceOrderDetail.path}/${data?.referenceId}`);
        } else if (data?.referenceType === sidebarResource.rentalManagement) {
          window.open(`${routes.rentalManagementDetail.path}/${data?.referenceId}`);
        } else if (data?.referenceType === sidebarResource.workOrder) {
          window.open(`${routes.workOrderDetail.path}/${data?.referenceId}`);
        }
      } else {
        setShowDetail({ open: true, data: data, anchor: args.el });
      }
    },
    [mapObjectToList, selectedLookUpResourceData?.product, selectedLookUpResourceData?.warehouse, selectedResource?.resource]
  );

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

  const resize = (event: EventResizeDoneArg['event'] | EventDropArg['event'], start, end) => {
    const filterEvents = staticEvents.filter((ev) => ev.id !== event.id);
    const existing = staticEvents.find((ev) => ev.id === event.id) ?? {};
    setEvents([...filterEvents, { ...existing, start, end }]);
    updateData({ id: event.id, start: event.start, end: event.end, resource: event.extendedProps.resource }, start, end);
  };

  const moveEvent = (arg: EventDropArg) => {
    resize(arg.event, arg.event.start, arg.event.end);
  };

  const resizeEvent = (arg: EventResizeDoneArg) => {
    resize(arg.event, arg.event.start, arg.event.end);
  };

  const onNavigate = useCallback((data: DatesSetArg) => {
    if (data?.view?.type === 'dayGridMonth') {
      setDateRange({
        estimateStartDate: dayjs.utc(data.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs.utc(data.end).tz().format('MM/DD/YYYY')
      });
    } else if (data?.view?.type === 'timeGridWeek') {
      setDateRange({
        estimateStartDate: dayjs.utc(data.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs.utc(data.end).tz().format('MM/DD/YYYY')
      });
    } else if (data?.view?.type === 'timeGridDay') {
      setDateRange({
        estimateStartDate: dayjs.utc(data.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs.utc(data.end).tz().format('MM/DD/YYYY')
      });
    } else if (data?.view?.type === 'agenda') {
      setDateRange({
        estimateStartDate: dayjs.utc(data.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs.utc(data.end).tz().format('MM/DD/YYYY')
      });
    }
  }, []);

  useEffect(() => {
    setFilteredColumns([]);
    setDeepFilters([]);
    setFilterByIds([]);
    setFilterTerm({});
    if (selectedResource) {
      setFields([]);
      if (![sidebarResource?.product, sidebarResource.employeeMaster]?.includes(selectedResource?.resource)) {
        axiosInstance()
          .get(`/field?resource=${selectedResource?.resource}`)
          .then(({ data }) => {
            setFields(data.data);
            const filters: any =
              selectedResource?.resource === sidebarResource.planning
                ? CUSTOM_FILTERS?.filter((f) => f?.fieldData?.fieldName != 'asset')
                : CUSTOM_FILTERS;
            setFilteredColumns([
              ...data?.data?.filter(
                (e) =>
                  ![
                    'fileUpload',
                    'multiFileUpload',
                    'imageUpload',
                    'multiImageUpload',
                    'richTextEditor',
                    'signature',
                    'groupSignature',
                    'colorPicker',
                    'counter',
                    'description',
                    'switch'
                  ].includes(e?.fieldData?.type)
              ),
              ...filters
            ]);
          });
      }
    }
  }, [selectedResource]);

  const dragAndDropOnSelectEvent = useCallback((args: EventClickArg) => {
    setShowDetail({ open: true, data: args.event, anchor: args.el });
  }, []);

  const fetchUserFilters = () => {
    const cancelTokenSource = axios.CancelToken.source();
    const cancelToken = cancelTokenSource.token;
    axiosInstance()
      .get(`/user-resource-filter?resource=${selectedResource?.resource}_planningView`)
      .then(({ data: { data } }) => {
        setUserFilters(data);
        const defaultFilter = data.find((d) => d.default);
        if (defaultFilter) {
          const { filterById, deepFilter } = createFilterSetData(defaultFilter, filteredColumns);
          setSelectedFilter(defaultFilter);
          setFilterByIds(filterById);
          setDeepFilters(deepFilter);
          setFilterTerm(defaultFilter?.filterTerm || {});
          fetchData(cancelToken, deepFilter, filterById, defaultFilter?.filterTerm || {});
        } else {
          fetchData(cancelToken, [], [], {});
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    const cancelToken = cancelTokenSource.token;
    if (selectedResource && selectedResource?.resource) {
      if (
        ![sidebarResource?.employeeMaster, sidebarResource?.product, sidebarResource?.serializedAsset]?.includes(selectedResource?.resource) &&
        filteredColumns?.length > 0
      ) {
        fetchUserFilters();
      } else if (
        [sidebarResource?.employeeMaster, sidebarResource?.product, sidebarResource?.serializedAsset]?.includes(selectedResource?.resource)
      ) {
        fetchData(cancelToken);
      }
    } else {
      setEvents([]);
    }
    return () => {
      cancelTokenSource.cancel('Operation canceled due to new request.');
    };
  }, [selectedResource, selectedResource?.resource, filteredColumns?.length, selectedLookUpResourceData, dateRange]);

  return (
    <>
      <div>
        <Box display="flex" flexDirection="column">
          <div className="flex flex-wrap items-center gap-2 max-[560px]:pt-[40px] min-[561px]:pr-[100px]">
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
            {selectedResource &&
              ![sidebarResource.product, sidebarResource.employeeMaster, sidebarResource.serializedAsset]?.includes(selectedResource?.resource) && (
                <ThemeButton
                  className="mr-2"
                  iconForMobile={<MdFilterList />}
                  onClick={() => {
                    setShowFilters(true);
                  }}
                  startIcon={<MdFilterList />}
                >
                  Show Filters
                </ThemeButton>
              )}
            {[sidebarResource.serializedAsset, sidebarResource.product, sidebarResource.employeeMaster].includes(selectedResource?.resource) &&
              selectedFilters?.map((filtered) => {
                return (
                  <RenderFilter
                    filtered={filtered}
                    lookupResource={lookupResource}
                    selectedLookUpResourceData={selectedLookUpResourceData}
                    setSelectedLookUpResourceData={setSelectedLookUpResourceData}
                    lookupLoading={lookupLoading}
                  />
                );
              })}
            {selectedResource?.resource === sidebarResource.product &&
              !isEmpty(selectedLookUpResourceData) &&
              selectedLookUpResourceData['product'] &&
              selectedLookUpResourceData['product']?.length > 0 && (
                <Box mt={0.5}>
                  <span className="relative">
                    <span className="absolute right-[3px] top-[3px] flex size-[5px] items-center justify-center rounded-full bg-red-500">
                      <span className="size-2 flex-shrink-0 animate-ping rounded-full bg-red-500/70"></span>
                    </span>
                    <HtmlTooltip title={'Warning: Unfulfilled Past Jobs Detected'}>
                      <IconButton
                        size={'small'}
                        onClick={() => {
                          setShowPlannedIncoming(true);
                        }}
                      >
                        <InfoIcon fontSize="small" color={'primary'} />
                      </IconButton>
                    </HtmlTooltip>
                  </span>
                  <InfoSidebarButton actionId={planningViewActions.warningUnfulfilledPastJobsDetected} resource={sidebarResource.planningView} />
                </Box>
              )}
          </div>
          <div className="mb-2 mt-2">
            <DisplayFilterChip
              filterTerm={filterTerm}
              resourceColumns={filteredColumns}
              deepFilters={deepFilters}
              filterByIds={filterByIds}
              fetchResourceData={(deepFilter, filterById) => {
                const cancelTokenSource = axios.CancelToken.source();
                const cancelToken = cancelTokenSource.token;
                fetchData(cancelToken, deepFilter, filterById);
              }}
              setDeepFilters={setDeepFilters}
              setFilterByIds={setFilterByIds}
            />
          </div>
        </Box>
        <div className={cn('relative')}>
          {[sidebarResource.rentalManagement, sidebarResource.planning, sidebarResource.fieldServiceOrder]?.includes(selectedResource?.resource) ? (
            <>
              <CustomCalendar
                events={events}
                editable={true}
                droppable={true}
                eventDrop={moveEvent}
                eventResize={resizeEvent}
                isLoading={isDataFetching}
                getEventStyle={setEventStyle}
                // popup={!mobileView}
                setView={setView}
                view={view}
                onNavigate={onNavigate}
                eventClick={dragAndDropOnSelectEvent}
              />
            </>
          ) : (
            <div className="relative min-h-[500px] ">
              <CustomCalendar
                events={events}
                getEventStyle={setEventStyle}
                isLoading={isDataFetching}
                // messages={{
                //   agenda: 'List'
                // }}
                setView={setView}
                view={view}
                onNavigate={onNavigate}
                eventClick={handleClick}
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
                <h5 className="text-sm">{`${isOpen?.eventData?.title} - ${displayDate(isOpen?.eventData?.start)}`}</h5>
                <HtmlTooltip title="Close">
                  <IconButton size="small" onClick={() => setOpen({ open: false, data: [], eventData: null })} className="close-icon-v1">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </HtmlTooltip>
              </div>
              {isOpen.data?.map((d) => (
                <Accordion key={d.key} defaultExpanded>
                  <AccordionSummary>
                    <h6 className=" text-sm font-semibold">{d.heading}</h6>
                  </AccordionSummary>
                  <AccordionDetails>
                    <RenderTable data={d.items} resources={resources} resourceList={resourceList} />
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Popover>
        )}

        {showDetail.open && (
          <DetailsPopover
            fields={fields}
            resourceDatas={resourceDatas}
            resourceList={resourceList}
            selectedResource={selectedResource}
            setShowDetail={setShowDetail}
            showDetail={showDetail}
          />
        )}
        {showPlannedIncoming && (
          <PlannedIncomingDialog
            handleClose={() => {
              setShowPlannedIncoming(false);
            }}
            products={selectedLookUpResourceData['product']}
            warehouses={selectedLookUpResourceData['warehouse']}
            resourceList={resourceList}
          />
        )}
        {showFilters && (
          <Filter
            onClose={() => {
              setShowFilters(false);
            }}
            loading={false}
            filterTitle={resources?.[selectedResource?.key]?.titleSingular}
            resource={`${selectedResource?.resource}_planningView`}
            columns={filteredColumns}
            onApplyFilter={() => {
              setShowFilters(false);
              fetchData();
            }}
            deepFilters={deepFilters}
            setDeepFilters={setDeepFilters}
            filterByIds={filterByIds}
            setFilterByIds={setFilterByIds}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            isVisibleFilterSet={true}
            fetchUserFilters={fetchUserFilters}
            userFilters={userFilters}
            selectedFilter={selectedFilter}
          />
        )}
      </div>
    </>
  );
}

export default forwardRef(CalendarView);

const RenderTable = ({ data, resources, resourceList }) => {
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
                    const resource = resourceList?.find((r) => r.resource === row?.resource);
                    if (resource) {
                      window.open(`${resource.path}/${row?.referenceId}`);
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
