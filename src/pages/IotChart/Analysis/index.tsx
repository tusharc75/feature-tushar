import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useCallback, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import SearchBox from 'src/components/Helpers/SearchBox';
import { useDebounce } from 'src/hooks';
import FilterModel from '../Helper/FilterModel';
import CollapsibleTree from './CollapsibleTree';
import dayjs from 'dayjs';

const group = (categories, data, searchKeyword = '') => {
  if (categories?.length === 0 || data?.length === 0 || !categories || !data) return [];
  const datapoints = data?.filter((e) =>
    searchKeyword?.trim() === '' ? true : e?.fieldLabel?.toLowerCase()?.includes(searchKeyword?.trim()?.toLowerCase())
  );

  const newCategory = [];
  for (let index = 0; index < categories.length; index++) {
    const category = categories[index];
    const filteredDtaPoints = datapoints?.filter((d) => d?.category?.optionValue === category?._id);
    const obj = {
      ...category,
      dataPoints: filteredDtaPoints || [],
      child: group(category.child, datapoints, searchKeyword)
    };
    newCategory.push(obj);
  }
  return newCategory;
};

const Analysis = ({ assetId, dataPoints }: { assetId: string; dataPoints: any[] }) => {
  const toastConfig = useContext(CustomToastContext);
  const [dateFilters, setDateFilters] = useState({
    from: new Date(dayjs().subtract(8, 'days').format('MM/DD/YYYY')),
    to: new Date(),
    intervals: 'perCycle'
  });

  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce<string>(searchValue, 500);
  const [categories, setCategories] = useState<any[] | null>(null);
  const [categoriesWihtFilteredData, setCategoriesWihtFilteredData] = useState([]);

  const fetchCategory = useCallback(async () => {
    axiosInstance()
      .get(`/dynamic-form`, {
        headers: {
          Resource: 'Iot Data Points Category'
        }
      })
      .then(({ data: { data } }) => {
        const categoryData: any = data?.filter((e) => !e.parentCategory);
        categoryData?.forEach((element) => {
          element.child = data?.filter((e) => e?.parentCategory?.optionValue === element?._id);
        });
        setCategories(categoryData);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  }, [toastConfig]);

  useEffect(() => {
    fetchCategory();
  }, []);

  useEffect(() => {
    if (categories && dataPoints) {
      const groupedData = group(categories, dataPoints, debouncedSearchValue);
      setCategoriesWihtFilteredData(groupedData);
    }
  }, [debouncedSearchValue, categories, dataPoints]);

  return (
    <>
      <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
        <Grid>
          <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
        </Grid>
        <Grid >
          <SearchBox
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
          />
        </Grid>
      </Grid>
      <Box mt={2}>
        {categories ? (
          <CollapsibleTree categories={categoriesWihtFilteredData} dateFilters={dateFilters} assetId={assetId} />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </>
  );
};

export default Analysis;
