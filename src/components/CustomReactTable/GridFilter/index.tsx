import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { sidebarResource } from 'src/constants/helpers';
import { fetchFieldOptions } from '../utils';
import Filter from 'src/components/Filter';
import { useData } from 'src/StateProvider/Provider';

function GridFilter({
  resource,
  handleClose,
  coloums,
  setColoums,
  deepFilters,
  setDeepFilters,
  filterByIds,
  setFilterByIds,
  filterTerm,
  setFilterTerm,
  handleApplyFilter,
  selectedFilter
}) {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { resources }
  }: any = useData();

  const [userFilters, setUserFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserFilters();
    fetchAllColumns();
  }, []);

  const fetchAllColumns = async () => {
    try {
      setLoading(true);
      const columns = await fetchFieldOptions({ resource, sidebarResource, toastConfig });
      setColoums(columns);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchUserFilters = () => {
    axiosInstance()
      .get(`/user-resource-filter?resource=${resource}`)
      .then(({ data: { data } }) => {
        setUserFilters(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <Filter
      onClose={handleClose}
      loading={loading}
      filterTitle={resources[camelCase(resource)]?.titleSingular}
      resource={resource}
      columns={coloums}
      onApplyFilter={handleApplyFilter}
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
  );
}

export default GridFilter;
