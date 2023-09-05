import { useCallback, useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Collapse, IconButton, TextField } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import Chart from '../Helper/Chart1';
import { uniqBy } from 'lodash';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  const [open, setOpen] = useState<string | false>(false);
  const [openChild, setOpenChild] = useState<string | false>(false);
  const [showAlert, setShowAlert] = useState(false)
  const [errorOptions, setErrorOptions] = useState([])
  const [selectedErrorOptions, setSelectedErrorOptions] = useState(null)

  const handleChange = useCallback((name: string) => {
    setOpen((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  const handleChangeChild = useCallback((name: string) => {
    setOpenChild((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  const compareCollapse = useCallback(
    (name: string, type: string) => {
      if (type === 'parentCategory')
        return open === name;
      else if (type === 'category')
        return openChild === name;
    },
    [open, openChild]
  );

  const TreeView = ({ data, type, allData = [] }) => {
    return (
      <>
        <div
          className={`flex flex-wrap justify-between items-center cursor-pointer py-2 px-1 rounded-md `}
          onClick={(e) => {
            e.stopPropagation();
            handleChange(`${data[type]?.optionValue}`);
          }}
        >
          <h6 className=" line-clamp-1 text-sm">{data[type]?.optionLabel}</h6>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (type === 'parentCategory')
                handleChange(`${data[type]?.optionValue}`);
              else if (type === 'category')
                handleChangeChild(`${data[type]?.optionValue}`);
            }}
          >
            {compareCollapse(`${data[type]?.optionValue}`, type) ? (
              <ExpandLess style={{ color: 'currentcolor' }} />
            ) : (
              <ExpandMore style={{ color: 'currentcolor' }} />
            )}
          </IconButton>
        </div>
        <Collapse in={compareCollapse(`${data[type]?.optionValue}`, type)} unmountOnExit>
          <div className="px-1">
            {
              type === 'parentCategory' ? (
                uniqBy(allData?.filter(d => d['category']?.parentCategory === open), 'category.optionValue')?.map((data => {
                  return (
                    <TreeView
                      data={data}
                      type={'category'}
                      allData={allData?.filter(d => d['category']?.optionValue === openChild)}
                    />
                  )
                }))
              )
                :
                type === 'category' ? (
                  allData?.filter((d) => d[type]?.optionValue === data[type]?.optionValue)?.map((dataPoint) => {
                    return (
                      <FormControlLabel
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
                        label={dataPoint?.fieldLabel}
                      />
                    )
                  })
                )
                  :
                  null
            }
          </div>
        </Collapse>
      </>
    )
  }

  const fetchErrorData = async () => {
    const { data: { data } } = await axiosInstance().get(`/report/iot/asset-error-message?asset=${assetId}`)
    const error: any = []
    uniqBy(data, '_id')?.forEach((e: any) => {
      if (e?.errorMessage) {
        error.push({
          optionLabel: e?.errorMessage,
          optionValue: e?._id
        })
      }
    });
    setErrorOptions(error)
  };

  useEffect(() => {
    if (showAlert) {
      fetchErrorData()
    } else {
      setSelectedErrorOptions(null)
    }
  }, [assetId, showAlert])

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
                    {
                      uniqBy(dataPoints.filter(d => d?.hasOwnProperty('parentCategory')), 'parentCategory.optionValue')?.map((category: any) => {
                        return (
                          <TreeView
                            data={category}
                            type={'parentCategory'}
                            allData={dataPoints.filter(d => d?.hasOwnProperty('parentCategory'))}
                          />
                        )
                      })
                    }
                    {
                      uniqBy(dataPoints.filter(d => !d?.hasOwnProperty('parentCategory')), 'category.optionValue')?.map((category: any) => {
                        return (
                          <TreeView
                            data={category}
                            type={'category'}
                            allData={dataPoints.filter(d => !d?.hasOwnProperty('parentCategory'))}
                          />
                        )
                      })
                    }
                  </>
                )}
              </FormGroup>
            </div>
          </div>
          <div className="container-with-border sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
            {Object.keys(selectedDataPoint).filter((item) => selectedDataPoint[item]).length ? (
              <>
                <Box display='flex' alignItems='center'>
                  <FormControlLabel
                    style={{ margin: 0 }}
                    control={
                      <Checkbox
                        checked={showAlert}
                        onChange={(e) => {
                          setShowAlert(e.target.checked);
                        }}
                        name="showAlert"
                        color="primary"
                      />
                    }
                    label="Show Alert"
                  />
                  {
                    showAlert && (
                      <Box ml={2}>
                        <Autocomplete
                          options={errorOptions}
                          multiple
                          fullWidth
                          style={{ minWidth: '260px' }}
                          getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                          value={selectedErrorOptions ? errorOptions?.filter((data: any) => selectedErrorOptions?.includes(data.optionValue)) : []}
                          getOptionSelected={(option: any, val: any) => option.optionValue === val.optionValue}
                          onChange={(e, newVal) => {
                            setSelectedErrorOptions(newVal?.map((val) => val.optionValue));
                          }}
                          size="small"
                          renderInput={(params) => <TextField {...params} label="Select Error" variant="outlined" />}
                        />
                      </Box>
                    )
                  }
                </Box>
                <Box mt={1}>
                  <Chart
                    dateFilters={dateFilters}
                    assetId={assetId}
                    dataPoints={Object.keys(selectedDataPoint)
                      .filter((_k) => selectedDataPoint[_k])
                      ?.map((k) => dataPoints?.find((d) => d.fieldName === k))}
                    errorDescriptions={selectedErrorOptions}
                  />
                </Box>
              </>
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
