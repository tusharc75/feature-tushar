import { Box, FormGroup, IconButton, useMediaQuery } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import SearchBox from 'src/components/Helpers/SearchBox';
import Chart from '../Helper/Chart';
import FilterModel from '../Helper/FilterModel';
import TreeViewNew from './TreeView';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';

const PerformanceAnalysis = ({ deviceTemplate = null, assetId, dataPoints = [] }) => {
  const toastConfig = useContext(CustomToastContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const isMobile = useMediaQuery('(max-width:640px)');
  const [dateFilters, setDateFilters] = useState({
    from: new Date(dayjs().subtract(8, 'day').startOf('day').toJSON()),
    to: new Date(),
    intervals: 'perCycle'
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

  useEffect(() => {
    if (isMobile) {
      setIsExpanded(true);
    }
  }, [isMobile]);

  const frostedGlass =
    'relative after:[content:""] after:absolute after:inset-0 after:z-10 after:bg-[rgba(var(--dark-primary-rgb,255,255,255),0.54)] after:[backdrop-filter:blur(2px)_!important]';

  return (
    <>
      <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
        <Grid>
          <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
        </Grid>
        <Grid>
          <SearchBox
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
          />
        </Grid>
      </Grid>
      <Box mt={2}>
        <div
          className={`grid grid-cols-1 gap-y-4 sm:gap-x-3 md:gap-x-4 ${
            isExpanded ? '' : '[--left-col-size:62px]'
          } transition-all duration-300 sm:grid-cols-[var(--left-col-size,5fr)_9fr]  md:grid-cols-[var(--left-col-size,4fr)_9fr] lg:grid-cols-[var(--left-col-size,320px)_1fr]`}
        >
          <div className={`container-with-border ${isExpanded ? '' : 'overflow-hidden'} `}>
            <div className="flex items-center justify-between gap-2 px-4 py-3 [border-bottom:1px_solid_var(--common-border-color)]">
              <p className={` text-[16px] font-semibold ${isExpanded ? '' : ' sr-only'}`}>Data Points</p>
              {isMobile ? null : (
                <IconButton size="small" onClick={() => setIsExpanded((prev) => !prev)}>
                  {isExpanded ? <ChevronLeft /> : <ChevronRight />}
                </IconButton>
              )}
            </div>

            <div
              className={`h-[250px] min-h-[300px] sm:h-[calc(100vh-310px)] ${
                isExpanded ? 'overflow-auto' : `overflow-hidden [&_*]:!line-clamp-1 [&_*]:!flex-nowrap [&_*]:!overflow-hidden ${frostedGlass}`
              } `}
            >
              <FormGroup>
                <div className="grid gap-2 p-2">
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
          <div className="container-with-border h-[250px] overflow-auto px-4 py-1 sm:h-[calc(574px-48px)]">
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
              <div className="grid min-h-[574px] place-items-center text-center text-xl font-semibold text-gray-400 dark:text-gray-300">
                <p className="select-none border-l-0 border-r-0 border-dashed py-4">Select Some Datapoints</p>
              </div>
            )}
          </div>
        </div>
      </Box>
    </>
  );
};

export default PerformanceAnalysis;
