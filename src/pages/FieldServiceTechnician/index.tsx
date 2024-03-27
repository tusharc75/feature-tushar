import { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { Box, Button, Dialog, IconButton } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomContainer from 'src/components/CustomContainer';
import { CustomDialogTransition, fieldServiceOrder, gridLoadingTimeout, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { camelCase } from 'lodash';
import { ListingPageHeader } from 'src/components/PageHeaders';
import VisibilityIcon from '@material-ui/icons/Visibility';
import AddIcon from '@material-ui/icons/Add';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from 'src/StateProvider/Provider';
import { cloneDisable } from 'src/constants/messageHelpers';
import ManageFieldTicket from '../FieldTicket/ManageFieldTicket';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import FieldTicketTable from '../FieldServiceOrder/FieldTicket/FieldTicketTable';
import ViewFieldTicketDialog from './ViewFieldTicketDialog';

let serchtimeTimeout;

const FieldServiceTechnician = () => {
  const types = [
    {
      key: `My ${routes.fieldServiceTechnician.title}`,
      value: 1
    },
    {
      key: `All ${routes.fieldServiceTechnician.title}`,
      value: 2
    }
  ];

  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.fieldServiceTechnician.title);
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();
  const { type }: any = queryString.parse(history.location.search);
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const { state, dispatch } = useTableReducer();
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [columns, setColumns] = useState(null);
  const [openDialog, setOpenDialog] = useState({ open: false, data: null });
  const [viewFieldTicket, setViewFieldTicket] = useState({ open: false, data: null });

  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchColumns();
  }, []);

  const fetchColumns = async () => {
    let data;

    const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldServiceOrder}`);
    data = response?.data?.data;

    const newColumns = generateColumns(renderedFrom, data, routes.fieldServiceOrderDetail.path);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.fieldTicket?.isCreate ? 'Create Field Ticket' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Add"
              disabled={permissions?.fieldTicket?.isCreate ? false : true}
              onClick={() => {
                setOpenDialog({ open: true, data: row?.original });
              }}
            >
              <AddIcon fontSize="small" color={permissions?.fieldTicket?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title="View Field Ticket">
          <span>
            <IconButton
              size="small"
              aria-label="View"
              onClick={() => {
                setViewFieldTicket({ open: true, data: row?.original });
              }}
            >
              <VisibilityIcon fontSize="small" color="primary" />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (serchtimeTimeout) {
      clearTimeout(serchtimeTimeout);
    }
    serchtimeTimeout = setTimeout(() => {
      fetchData();
    }, millisec);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, showFilteredRecordsOnly, selectedType]);

  const fetchData = async () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`${fieldServiceOrder.api}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u) => {
          let finalObject = prepareDataForGrid(u);
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: routes.fieldServiceTechnician.title }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            resource={sidebarResource.fieldServiceTechnician}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {openDialog.open && (
        <ManageFieldTicket
          id={null}
          isClone={false}
          onClose={() => setOpenDialog({ open: false, data: null })}
          referenceData={{
            customerAccount: openDialog?.data?.customerAccountId || '',
            billingAddress: openDialog?.data?.billingAddressId || '',
            shippingAddress: openDialog?.data?.shippingAddressId || '',
            fieldServiceOrder: openDialog?.data?._id || '',
            warehouse: openDialog?.data?.warehouseId || '',
            wellName: openDialog?.data?.wellNameId || '',
            wellNumber:
              [{ optionLabel: openDialog?.data?.wellNumber, optionValue: openDialog?.data?.wellNumberId }, ...openDialog?.data?.restwellNumber]?.map(
                (m) => m?.optionValue
              ) || [],
            numberOfWells: openDialog?.data?.numberOfWells,
            estimateStartDate: openDialog?.data?.estimateStartDate || '',
            estimateEndDate: openDialog?.data?.estimateEndDate || '',
            taxCode: openDialog?.data?.taxCodeId || '',
            pricingCondition: openDialog?.data?.pricingConditionId || '',
            collaborator:
              [
                { optionLabel: openDialog?.data?.collaborator, optionValue: openDialog?.data?.collaboratorId },
                ...openDialog?.data?.restcollaborator
              ]?.map((m) => m?.optionValue) || []
          }}
          onSuccess={() => {
            setOpenDialog({ open: false, data: null });
            fetchData();
          }}
          renderedFrom={`${renderedFrom}_craete_${camelCase(routes.fieldTicket.title)}`}
        />
      )}

      {viewFieldTicket.open && (
        <ViewFieldTicketDialog
          onClose={() => {
            setViewFieldTicket({ open: false, data: null });
          }}
          serviceOrderData={viewFieldTicket?.data}
          renderedFrom={`${renderedFrom}_craete_${camelCase(routes.fieldTicket.title)}`}
        />
      )}
    </section>
  );
};

export default FieldServiceTechnician;
