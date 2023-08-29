import { useCallback, useState } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup, Collapse, IconButton } from '@material-ui/core';
import moment from 'moment';
import FilterModel from '../Helper/FilterModel';
import Chart from '../Helper/Chart1';
import _ from 'lodash';
import { TreeItem, TreeView } from '@material-ui/lab';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

const PerformanceAnalysis = ({ assetId, dataPoints = [] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(15, 'days').format('MM-DD-YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [selectedDataPoint, setSelectedDataPoint] = useState({});

  const [open, setOpen] = useState<string | false>(false);

  const handleChange = useCallback((name: string) => {
    setOpen((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  const compareCollapse = useCallback(
    (name: string) => {
      return open === name;
    },
    [open]
  );

  // const RecursiveTreeView = ({ node }) => (
  //   <TreeItem key={node?.category} nodeId={node?.category?.toString()} label={node?.category}>
  //     {Array.isArray(node.children) ? node.children.map((childNode) => <RecursiveTreeView key={childNode.id} node={childNode} />) : null}
  //   </TreeItem>
  // );

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
                {Array.isArray(dataPoints) &&
                  _.uniqBy(dataPoints, 'category')?.map((d: any, i) => {
                    return (
                      <>
                        <div
                          className={`flex flex-wrap justify-between items-center cursor-pointer py-2 px-1 rounded-md `}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange(`${d?.category}`);
                          }}
                        >
                          <h6 className=" line-clamp-1 text-sm">{d?.category}</h6>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChange(`${d?.category}`);
                            }}
                          >
                            {compareCollapse(`${d?.category}`) ? (
                              <ExpandLess style={{ color: 'currentcolor' }} />
                            ) : (
                              <ExpandMore style={{ color: 'currentcolor' }} />
                            )}
                          </IconButton>
                        </div>
                        <Collapse in={compareCollapse(`${d?.category}`)} unmountOnExit>
                          <div className="px-1">
                            {dataPoints
                              ?.filter((data) => data?.category === d?.category)
                              ?.map((dataPoint) => {
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
                                );
                              })}
                          </div>
                        </Collapse>
                      </>
                    );
                  })}
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
