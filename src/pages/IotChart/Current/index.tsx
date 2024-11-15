import { Box, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import RefreshIcon from '@material-ui/icons/Refresh';
import { startCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn, dateTimeFormat24Hours } from 'src/constants/helpers';
import TreeView from './TreeView';

export default function Current({ deviceTemplate, assetId }) {
  const toastConfig = useContext(CustomToastContext);

  const [errorData, setErrorData] = useState(null);
  const [expandedAccordition, setExpandedAccordition] = useState({});
  const [categories, setCategories] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchCategory();
    fetchData();
    fetchErrorData();
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
        if (categoryData?.length) {
          setExpandedAccordition({ [categoryData[0]._id]: true });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchData = async () => {
    setCurrentData(null);
    axiosInstance()
      .get(`/report/iot-current-status`, {
        params: {
          asset: assetId
        }
      })
      .then(({ data: { data } }) => {
        setCurrentData(data?.dataPointData || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchErrorData = async () => {
    setErrorData(null);
    axiosInstance()
      .get(`/report/iot-alerts?asset=${assetId}&page=0&limit=25`)
      .then(({ data: { data } }) => {
        setErrorData(data?.filter((e) => e?.message));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box pb={2}>
        <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
          <Grid item>
            <SearchBox
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              value={searchValue}
            />
          </Grid>
          <Grid item>
            <HtmlTooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => {
                  fetchData();
                  fetchErrorData();
                }}
              >
                <RefreshIcon />
              </IconButton>
            </HtmlTooltip>
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={2}>
        <Grid item lg={8} md={8} sm={12} xs={12}>
          {categories && currentData ? (
            currentData?.length ? (
              <div className="grid gap-3 md:gap-4">
                {categories?.map((category: any, index) => (
                  <TreeView
                    expandedAccordition={expandedAccordition}
                    setExpandedAccordition={setExpandedAccordition}
                    category={category}
                    currentData={
                      searchValue?.trim() === ''
                        ? currentData
                        : currentData?.filter((e) => e?.fieldLabel?.toLowerCase()?.includes(searchValue?.trim()?.toLowerCase()))
                    }
                    assetId={assetId}
                    deviceTemplate={deviceTemplate}
                  />
                ))}
              </div>
            ) : (
              <Box mt={5} textAlign="center">
                <p>No Data Found</p>
              </Box>
            )
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
        <Grid item lg={4} md={4} sm={12} xs={12}>
          {errorData ? (
            <div className="rounded-lg border shadow-lg">
              <div className="head pb-2 pt-4 md:p-6 md:pb-3">
                <h5 className="text-[18px] font-semibold leading-[1.5]">Alert</h5>
              </div>
              <ul className="body h-[calc(100vh-230px)] min-h-[500px] overflow-y-auto p-[16px] pt-[8px] md:p-6 md:pt-3">
                {errorData?.map((data: any, index) => (
                  <li key={'cell ' + index + 1} className={cn('min-h-[70px] list-none [border-top:1px_dashed_var(--common-border-color)]')}>
                    <div className="py-[15px]">
                      <p className="text-[0.875rem] font-semibold leading-[1.5714]">{data?.message}</p>
                      <p className="text-[0.75rem] font-normal leading-[1.5] text-gray-500 dark:text-gray-400">
                        {moment(data?.time).format(dateTimeFormat24Hours)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
    </>
  );
}
