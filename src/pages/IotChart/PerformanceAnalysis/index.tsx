import { useContext, useEffect, useState } from 'react';
import { Box, FormGroup, Collapse, IconButton, TextField, Grid } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import Chart from '../Helper/Chart';
import SearchBox from 'src/components/Helpers/SearchBox';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import TreeViewNew from './TreeView';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const PerformanceAnalysis = ({ deviceTemplate = null, assetId, dataPoints = [] }) => {
  const toastConfig = useContext(CustomToastContext);

  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').startOf('day').toJSON()),
    to: new Date(),
    intervals: '1hour'
  });

  const [selected, setSelected] = useState({
    dataPoints: {}
  });

  const [expandedAccordition, setExpandedAccordition] = useState({});
  const [categories, setCategories] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchCategory();
  }, [assetId]);

  const fetchCategory = async () => {
    axiosInstance()
      .get(`/dynamic-form?sortBy=order&orderBy=asc`, {
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
  };

  return (
    <>
      <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
        <Grid>
          <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
        </Grid>
        <Grid item>
          <SearchBox
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
            size="small"
          />
        </Grid>
      </Grid>
      <Box mt={2}>
        <div className="grid gap-y-4 sm:gap-x-3 md:gap-x-4 grid-cols-1 sm:grid-cols-[5fr_9fr] md:grid-cols-[4fr_9fr] lg:grid-cols-[320px_1fr]">
          <div className="container-with-border">
            <p className=" font-semibold px-4 py-3 text-[16px]" style={{ borderBottom: '1px solid var(--common-border-color)' }}>
              Data Points
            </p>
            <div className="sm:h-[calc(574px-48px)] h-[250px] px-2 overflow-auto py-1">
              <FormGroup>
                <div className="grid gap-2">
                  {categories ? (
                    categories?.map((category: any, index) => (
                      <TreeViewNew
                        expandedAccordition={expandedAccordition}
                        setExpandedAccordition={setExpandedAccordition}
                        category={category}
                        currentData={
                          searchValue?.trim() === ''
                            ? dataPoints
                            : dataPoints?.filter((e) => e?.fieldLabel?.toLowerCase()?.includes(searchValue?.trim()?.toLowerCase()))
                        }
                        selected={selected}
                        setSelected={setSelected}
                      />
                    ))
                  ) : (
                    <Box p={2} height={500}>
                      <CommonSkeleton lenArray={[...Array(10).keys()]} />
                    </Box>
                  )}
                </div>
              </FormGroup>
            </div>
          </div>
          <div className="container-with-border sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
            {Object.keys(selected.dataPoints).filter((item) => selected.dataPoints[item]).length ? (
              <Chart
                deviceTemplate={deviceTemplate}
                dateFilters={dateFilters}
                assetId={assetId}
                dataPoints={
                  Object.keys(selected.dataPoints).filter((item) => selected.dataPoints[item]).length &&
                  Object.keys(selected.dataPoints)
                    .filter((_k) => selected.dataPoints[_k])
                    ?.map((k) => dataPoints?.find((d) => d.fieldName === k))
                }
              />
            ) : (
              <div className="text-center grid place-items-center text-xl font-semibold text-gray-400 dark:text-gray-300 min-h-[574px]">
                <p className="border-dashed border-r-0 border-l-0 py-4 select-none">Select Some Datapoints</p>
              </div>
            )}
          </div>
        </div>
      </Box>
    </>
  );
};

export default PerformanceAnalysis;
