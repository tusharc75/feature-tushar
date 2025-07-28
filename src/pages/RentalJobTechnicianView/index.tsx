import { camelCase } from "lodash";
import { useContext, useEffect, useState } from "react";
import { Box } from "@mui/material";
import axios, { CancelTokenSource } from "axios";
import axiosInstance from "src/axios/axiosInstance";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from "src/components/CustomReactTable";
import routes from "src/components/Helpers/Routes";
import { ListingPageHeader } from "src/components/PageHeaders";
import { getDefaultMyRecordType, gridLoadingTimeout, prepareDataForGrid, rentalManagement, sidebarResource } from "src/constants/helpers";
import { CustomOfflineContext } from "src/StateProvider/OfflineContext/OfflineContext";
import { useData } from "src/StateProvider/Provider";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import CustomContainer from "src/components/CustomContainer";
import { findAll, findOne, objectStore } from "src/constants/indexdbhelper";
import OnField from "src/pages/FieldServiceOrder/OnField";

const RentalJobTechnicianView = () => {
  const renderedFrom = camelCase(sidebarResource.rentalManagement);
  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);
  const {
    state: { permissions, user, selectedEntity, resources }
  }: any = useData();

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly, dataRows, initialDataLoaded } = state;
  
  const { generateColumns } = useColumns();
  const [columns, setColumns] = useState(null);
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.rentalManagement));
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    fetchGridColumns();
    const cancelToken = axios.CancelToken.source();
    fetchData(cancelToken);
    return () => cancelToken.cancel();
  }, [page, limit, filters, sorting, search, selectedType]);

  const fetchGridColumns = async () => {
    try {
      let data;
      if (isOffline) {
        data = await findOne(objectStore.resource, sidebarResource.rentalManagement);
      } else {
        const response = await axiosInstance().get(`/field?resource=${sidebarResource.rentalManagement}&entity=${selectedEntity}&view=true`);
        data = response?.data?.data;
      }

      const newColumns = generateColumns(renderedFrom, data, routes.rentalManagementDetail.path);
      const staticFields = getStaticFields();
      setColumns([...newColumns, ...staticFields]);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    
    if (selectedType === 1) {
      deepFilter += `&openRecords=1`;
    } else if (selectedType === 2) {
      deepFilter += `&myRecords=1`;
    } else if (selectedType === 4) {
      deepFilter += `&closedRecords=1`;
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    try {
      let data: any = [], count;
      if (!isOffline) {
        const response = await axiosInstance().get(`${rentalManagement.api}${queryString}`, { 
          cancelToken: cancelTokenSource?.token 
        });
        data = response?.data?.data;
        count = response?.data?.count;
      } else {
        data = await findAll(objectStore.rentalManagement);
        count = data?.length || 0;
      }

      const rows = data.map((u) => {
        const finalObject = prepareDataForGrid(u);
        finalObject["isChecked"] = selectedRecords.some((s) => s._id === u._id);
        return finalObject;
      });

      dispatch({ type: 'initialize', data: rows, count });
    } catch (error) {
      if (!axios.isCancel(error)) {
        toastConfig.setToastConfig(error);
      }
    } finally {
      setTimeout(() => {
        dispatch({ type: 'loading', loading: false });
      }, gridLoadingTimeout);
    }
  };

  const handleSearch = (e) => {
    setSelectedData(null);
    dispatch({ type: 'search', search: e.target.value });
  };

  const onRowClick = (row) => {
    if (!selectedData || row._id !== selectedData._id) {
      setSelectedData(row);
    }
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.rentalManagement?.titlePlural }]} />
        {initialDataLoaded && (
          <ListingPageHeader
            searchValue={search}
            onSearch={handleSearch}
            isActionButtonVisible={false}
            isAddButtonVisible={false}
          />
        )}
      </div>
      <CustomContainer>
        {columns ? (
          <div className="relative grid grid-cols-1 gap-4 md:min-h-[calc(100vh-200px)] md:grid-cols-[400px_1fr]">
            <div className="container-with-border p-[20px] md:min-h-[calc(100vh-200px)]">
              <CustomReactTable
                showOnlyMobileView={true}
                height={'calc(100vh - 200px)'}
                columns={columns}
                state={state}
                dispatch={dispatch}
                renderedFrom={renderedFrom}
                refreshGrid={fetchData}
                resource={sidebarResource.rentalManagement}
                showOnlyShowFilteredRecordSwitch={false}
                hideSelection={true}
                setWholeRowsCellColor={(row) =>
                  row._id === selectedData?._id
                    ? '[box-shadow:inset_0px_0px_0px_3px_var(--new-theme-color)_!important]'
                    : ''
                }
                onRowClick={onRowClick}
                showFilters={!isOffline}
              />
            </div>
            <div className="container-with-border p-[20px]">
              {selectedData ? (
                <OnField 
                  key={selectedData._id}
                  rentalJob={selectedData._id}
                  referenceFrom={renderedFrom}
                  referenceData={selectedData}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <h6 className="text-xl text-gray-400">Please select a record</h6>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </section>
  );
};

export default RentalJobTechnicianView;