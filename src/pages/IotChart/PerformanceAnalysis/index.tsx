import { useCallback, useState } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Collapse, IconButton, TextField, Grid } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import Chart from '../Helper/Chart';
import { uniqBy } from 'lodash';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  const [open, setOpen] = useState({});
  const [openChild, setOpenChild] = useState({});

  const handleChange = (name: string) => {
    setOpen((prev) => ({
      ...prev,
      [name]: open[name] ? false : true
    }));
  };

  const handleChangeChild = (name: string) => {
    setOpenChild((prev) => ({
      ...prev,
      [name]: openChild[name] ? false : true
    }));
  };

  const compareCollapse = useCallback(
    (name: string, type: string) => {
      if (type === 'parentCategory') return open[name];
      else if (type === 'category') return openChild[name];
    },
    [open, openChild]
  );

  const TreeView = ({ data, type, allData = [] }) => {
    return (
      <div key={data[type]?.optionLabel} className=" shadow-[0px_4px_20px_rgba(0,_0,_0,_0.06)] my-3 rounded-md ">
        <div
          className={`flex flex-wrap justify-between items-center cursor-pointer py-1 px-3 rounded-md transition-all duration-[300ms]  ${
            compareCollapse(`${data[type]?.optionValue}`, type)
              ? 'bg-[var(--new-theme-color)] text-white'
              : 'hover:bg-gray-300 dark:hover:bg-gray-800'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (type === 'parentCategory') handleChange(`${data[type]?.optionValue}`);
            else if (type === 'category') handleChangeChild(`${data[type]?.optionValue}`);
          }}
        >
          <h6 className=" line-clamp-1 text-sm">{data[type]?.optionLabel}</h6>
          <IconButton
            size="small"
            className={`${compareCollapse(`${data[type]?.optionValue}`, type) ? 'text-white' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (type === 'parentCategory') handleChange(`${data[type]?.optionValue}`);
              else if (type === 'category') handleChangeChild(`${data[type]?.optionValue}`);
            }}
          >
            {compareCollapse(`${data[type]?.optionValue}`, type) ? (
              <ExpandLess style={{ color: 'currentcolor' }} />
            ) : (
              <ExpandMore style={{ color: 'currentcolor' }} />
            )}
          </IconButton>
        </div>
        <Collapse in={compareCollapse(`${data[type]?.optionValue}`, type)} key={data[type]?.optionLabel} unmountOnExit>
          <div className="pl-4 pr-2" key={data[type]?.optionLabel}>
            {type === 'parentCategory'
              ? uniqBy(
                  allData?.filter((d) => d['category']?.parentCategory === data[type]?.optionValue),
                  'category.optionValue'
                )?.map((data) => {
                  return (
                    <TreeView
                      data={data}
                      type={'category'}
                      allData={allData?.filter((d) => d['category']?.optionValue === data?.category?.optionValue)}
                    />
                  );
                })
              : type === 'category'
              ? allData
                  ?.filter((d) => d[type]?.optionValue === data[type]?.optionValue)
                  ?.map((dataPoint) => {
                    return (
                      <div className="max-w-full">
                        <FormControlLabel
                          key={dataPoint?.fieldName}
                          title={dataPoint?.fieldLabel}
                          control={
                            <Checkbox
                              onChange={(e) => {
                                setSelectedDataPoint({ ...selectedDataPoint, [dataPoint?.fieldName]: e.target.checked });
                              }}
                              checked={selectedDataPoint[dataPoint?.fieldName]}
                              inputProps={{
                                'aria-labelledby': `checkbox-list-label-select-all`
                              }}
                            />
                          }
                          className="  max-w-full [&>span+span]:max-w-full [&>span+span]:block [&>span+span]:line-clamp-1 "
                          label={<div className="line-clamp-1 [overflow-wrap:anywhere]">{dataPoint?.fieldLabel}</div>}
                        />
                      </div>
                    );
                  })
              : null}
          </div>
        </Collapse>
      </div>
    );
  };

  return (
    <>
      <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
      <Box mt={2}>
        <div className="grid gap-y-4 sm:gap-x-3 md:gap-x-4 grid-cols-1 sm:grid-cols-[5fr_9fr] md:grid-cols-[4fr_9fr] lg:grid-cols-[320px_1fr]">
          <div className="container-with-border">
            <p className=" font-semibold px-4 py-3 text-[16px]" style={{ borderBottom: '1px solid var(--common-border-color)' }}>
              Data Points
            </p>
            <div className="sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
              <FormGroup>
                {Array.isArray(dataPoints) && (
                  <>
                    {uniqBy(
                      dataPoints.filter((d) => d?.hasOwnProperty('parentCategory')),
                      'parentCategory.optionValue'
                    )?.map((category: any) => {
                      return (
                        <TreeView data={category} type={'parentCategory'} allData={dataPoints.filter((d) => d?.hasOwnProperty('parentCategory'))} />
                      );
                    })}
                    {uniqBy(
                      dataPoints.filter((d) => !d?.hasOwnProperty('parentCategory')),
                      'category.optionValue'
                    )?.map((category: any) => {
                      return <TreeView data={category} type={'category'} allData={dataPoints.filter((d) => !d?.hasOwnProperty('parentCategory'))} />;
                    })}
                  </>
                )}
              </FormGroup>
            </div>
          </div>
          <div className="container-with-border sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
            {Object.keys(selectedDataPoint).filter((item) => selectedDataPoint[item]).length ? (
              <Chart
                dateFilters={dateFilters}
                assetId={assetId}
                dataPoints={Object.keys(selectedDataPoint)
                  .filter((_k) => selectedDataPoint[_k])
                  ?.map((k) => dataPoints?.find((d) => d.fieldName === k))}
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
