import { Refresh } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import axios from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BiFilterAlt } from 'react-icons/bi';
import axiosInstance from 'src/axios/axiosInstance';
import { createFilterSetData } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import Filter from 'src/components/Filter';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Column, DeepFilter, FilterByID, FilterTerm, UseCanbanStore } from 'src/components/KanbanView/types';
import DisplayFilterChip from 'src/pages/Reports/tables/DisplayFilterChip';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

type KanbanHeaderProps<D> = {
  sendRefreshSignal: () => void;
  state: UseCanbanStore<D>;
  renderedFrom: string;
  resource: string;
  pivotColumn: Column<D>;
};

const KanbanHeader = <D,>({ sendRefreshSignal, state, resource, renderedFrom, pivotColumn }: KanbanHeaderProps<D>) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources }
  }: any = useData();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { resourceColumns, setState, filterTerm, filterByIdsOriginal, deepFiltersOriginal } = state;
  const [userFilters, setUserFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filteredResourceFilter = useMemo(() => {
    if (resourceColumns.length === 0) return [];
    return resourceColumns.filter((d) => d.fieldData.fieldName !== (pivotColumn.id || pivotColumn.accessor));
  }, [pivotColumn, resourceColumns]);

  const fetchUserFilters = () => {
    axiosInstance()
      .get(`/user-resource-filter?resource=${resource}`)
      .then(({ data: { data } }) => {
        setUserFilters(data);
        const defaultFilter = data.find((d) => d.default);
        if (defaultFilter) {
          const { filterById, deepFilter } = createFilterSetData(defaultFilter, resourceColumns);
          setSelectedFilter(defaultFilter);
          setFilterByIds(filterById);
          setDeepFilters(deepFilter);
          setFilterTerm(defaultFilter?.filterTerm || {});
          sendRefreshSignal();
        } else {
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const setDeepFilters = (valueOrFunc: DeepFilter[] | ((prev: DeepFilter[]) => DeepFilter[])) => {
    if (typeof valueOrFunc === 'function') {
      const newValue = valueOrFunc(deepFiltersOriginal);
      setState('setDeepFiltersOriginal', newValue);
    } else {
      setState('setDeepFiltersOriginal', valueOrFunc);
    }
  };

  const setFilterByIds = (valueOrFunc: FilterByID[] | ((prev: FilterByID[]) => FilterByID[])) => {
    if (typeof valueOrFunc === 'function') {
      const newValue = valueOrFunc(filterByIdsOriginal);
      setState('setFilterByIdsOriginal', newValue);
    } else {
      setState('setFilterByIdsOriginal', valueOrFunc);
    }
  };

  const setFilterTerm = (valueOrFunc: FilterTerm | ((prev: FilterTerm) => FilterTerm)) => {
    if (typeof valueOrFunc === 'function') {
      const newValue = valueOrFunc(filterTerm);
      setState('setFilterTerm', newValue);
    } else {
      setState('setFilterTerm', valueOrFunc);
    }
  };

  useEffect(() => {
    fetchUserFilters();
  }, []);

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-2">
        <DisplayFilterChip
          filterTerm={filterTerm}
          resourceColumns={filteredResourceFilter}
          deepFilters={filterByIdsOriginal as any}
          filterByIds={deepFiltersOriginal as any}
          fetchResourceData={(deepFilter, filterById) => {
            sendRefreshSignal();
          }}
          setDeepFilters={setDeepFilters}
          setFilterByIds={setFilterByIds}
        />
        <div className="flex items-center gap-2">
          {filteredResourceFilter.length > 0 && (
            <ThemeButton
              onClick={() => setIsFilterOpen(true)}
              startIcon={<BiFilterAlt />}
              mobileTooltip="Apply Filters"
              iconForMobile={<BiFilterAlt />}
            >
              Filters
            </ThemeButton>
          )}
          <HtmlTooltip title="Refresh" placement="top" arrow>
            <IconButton
              className={`refresh-arrange-button`}
              color="primary"
              size="small"
              onClick={() => {
                sendRefreshSignal();
              }}
            >
              <Refresh style={{ fontSize: '20px' }} />
            </IconButton>
          </HtmlTooltip>
        </div>
      </div>
      {isFilterOpen && (
        <>
          <Filter
            onClose={() => {
              setIsFilterOpen(false);
            }}
            loading={false}
            filterTitle={resources?.[renderedFrom]?.titleSingular}
            resource={resource}
            columns={filteredResourceFilter}
            onApplyFilter={() => {
              setIsFilterOpen(false);
              sendRefreshSignal();
            }}
            deepFilters={deepFiltersOriginal}
            setDeepFilters={setDeepFilters}
            filterByIds={filterByIdsOriginal}
            setFilterByIds={setFilterByIds}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            isVisibleFilterSet={true}
            fetchUserFilters={fetchUserFilters}
            userFilters={userFilters}
            selectedFilter={selectedFilter}
          />
        </>
      )}
    </>
  );
};

export default KanbanHeader;
