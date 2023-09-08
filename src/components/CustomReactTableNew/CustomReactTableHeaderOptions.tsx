import React, { useContext, useEffect, useState, useRef } from 'react';
import { createStyles, withStyles, Theme, FormControlLabel, Switch, Typography, SwitchClassKey, SwitchProps, Chip } from '@material-ui/core';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../axios/axiosInstance';
import CloseIcon from '@material-ui/icons/Close';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../constants/useColumns';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import _ from 'lodash';

let timeout;

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}
interface Props extends SwitchProps {
  classes: Styles;
}

const CustomSwitch = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 37,
      height: 20,
      padding: 0,
      margin: `0 ${theme.spacing(1)}px 0 0`
    },
    switchBase: {
      padding: '2px',
      '&$checked': {
        transform: 'translateX(16px)',
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: '#B7B7B7',
          opacity: 1,
          border: 'none'
        }
      },
      '&$focusVisible $thumb': {
        color: '#52d869',
        border: '6px solid #fff'
      },
      '&.Mui-disabled': {
        color: `${theme.palette.grey[100]} !important`
      }
    },
    thumb: {
      width: 16,
      height: 16
    },
    track: {
      borderRadius: 26 / 2,
      border: `1px solid ${theme.palette.grey[400]}`,
      backgroundColor: '#B7B7B7',
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border'])
    },
    checked: {},
    focusVisible: {}
  })
)(({ classes, ...props }: Props) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      // disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked
      }}
      {...props}
    />
  );
});


function CustomReactTableHeaderOptions({
  columns,
  // setColumns,
  // columnApi,
  // refreshGrid = null,
  renderedFrom = null,
  isClientSideGrid = false,
  dispatchTable = null,
  showOnlyShowFilteredRecordSwitch = false,
  saveColumnOptions = false,
  selectedRecords = 0,
  // selectedReportView = null,
  // setSelectedReportView = null
  setHiddenColumns = null,
  getToggleHideAllColumnsProps = null,
  setColumnOrder = null,
  customFilters = null
}) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);

  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [checked, setChecked] = useState(false);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [chipData, setChipData] = useState([]);
  const [isFilterPresent, setIsFilterPresent] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    state: { user }
  }: any = useData();
  const { dispatch }: any = useData();

  useEffect(() => {

    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(selectedRecords === 0);
        if (initialValue?.length === 0 && checked) {
          setChecked(false);
          dispatchTable({
            type: 'showFilteredRecordsOnly'
          });
        }
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }

  }, [selectedRecords]);

  const updateGridHiddenColumns = (hiddenColumns = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let data = localStorage.getItem('gridMetaData');
      let request = data == 'undefined' ? {} : { ...JSON.parse(data) };
      if (request[renderedFrom]) {
        request[renderedFrom].hide = [...hiddenColumns];
      } else {
        request[renderedFrom] = {
          hide: [...hiddenColumns],
          staticColumns: {
            createdBy: false,
            updatedBy: false
          },
          disable: disabledColumns[renderedFrom] ?? []
        };
      }
      updateGridMetaData(request);
    }, 600);
  };
  const updateGridMetaData = (request) => {
    axiosInstance()
      .post(`user/meta-grid`, {
        _id: user?.user?._id,
        gridMetaData: { ...request }
      })
      .then((data) => {
        fetchGridMetaData();
      });
  };
  const fetchGridMetaData = () => {
    axiosInstance()
      .get(`user/meta-grid/${user?.user?._id}`)
      .then(({ data: { data } }) => {
        let tempMetaData = JSON.stringify(data?.gridMetaData);
        localStorage.setItem('gridMetaData', tempMetaData);
        if (dispatch) {
          dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
        }
      });
  };

  // useEffect(() => {
  //     if (!selectedReportView || !columnApi) return

  //     localStorage.removeItem(renderedFrom)

  //     const columnView = JSON.parse(selectedReportView.columnState);

  //     columnApi.setColumnState(columnView);

  // }, [selectedReportView, columnApi])

  const clearSingleFilter = (name) => {
    const newFilters = delete customFilters?.name;
    dispatchTable({ type: 'filter', filters: newFilters });
    setChipData((prev) => prev.filter((item) => item.name !== name));
  };

  const clearFilterAll = () => {
    dispatchTable({ type: 'filter', filters: {} });
    setSelectedFilter(null);
    setChipData([]);
    // setCurrentFomValue({});
  };
  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  return (
    <>
     <div
          className="table-filter-v1"
        style={{ flexBasis: isFilterPresent ? '766px' : 'unset', maxWidth: isFilterPresent ? '766px' : 'unset', paddingRight: '52px' }}
        >
      {showOnlyShowFilteredRecordSwitch && (

        <>
          <FormControlLabel
            value={checked}
            checked={checked}
            onChange={() => {
              setChecked(!checked);

              if (dispatchTable) {
                dispatchTable({
                  type: 'showFilteredRecordsOnly'
                });
              }
            }}
            control={<CustomSwitch disabled={disableSelectionSwitch} />}
            style={{ fontSize: '0.8rem', marginLeft: 0, padding: '0px 0 10px' }}
            label={<Typography style={{ fontWeight: 400 }}>Show Only Selected</Typography>}
            labelPlacement="end"
          />

        </>
      )}
      {Object.keys(customFilters).length>0 && (
        <div style={{minWidth : '450px'}}>
            <DisplyaFilters
            columns = {columns}
            customFilters = {customFilters}
              selectedFilter={selectedFilter}
              chipData={chipData}
              setChipData={setChipData}
              handleFilterOpen={handleFilterOpen}
              clearSingleFilter={clearSingleFilter}
              clearFilterAll={clearFilterAll}
              setIsFilterPresent={setIsFilterPresent}
            />
            </div>
          )}
    </div>
    </>
  );
}

export default CustomReactTableHeaderOptions;

// THIS COMPONENT WILL DISPLAY CHIPS ===============================>
const DisplyaFilters = (props) => {
  const { chipData, setChipData, selectedFilter, handleFilterOpen, clearSingleFilter, clearFilterAll, setIsFilterPresent, customFilters, columns } = props;
  const [hiddenItems, setHiddenItems] = useState(0);
  const isAppliedFilterPresent = React.useMemo(() => Object.keys(selectedFilter || {}).length > 0, [selectedFilter]);
  const oldModalRef = React.useRef(null);

  const containerRef = useRef(null);
  const countRef = useRef(null);
  const COUNT_PADDING = 10;

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [chipData]);

  const chipDataSetter = (filterModel) => {
    if (filterModel) {
      const keys = Object.keys(filterModel);
      const filterData = [];
      for (let i = 0; i < keys.length; i++) {
        const element = filterModel[keys[i]];
        const currentColumn =columns.find((col)=>col.accessor === keys[i]);
        if (currentColumn.cellRenderer === 'dateRenderer') {
          const dateValue =
            element.filter.from && element.filter.to
              ? `${element.filter.from ? element.filter.from : null} - ${element.filter.to ? element.filter.to : null}`
              : element.filter.from || element.filter.to
              ? `${element.filter.from ? `${element.filter.from} (From Date)` : ''} ${element.filter.to ? `${element.filter.to} (To Date)` : ''}`
              : null;
          const data = { title: currentColumn?.Header || _.startCase(keys[i]), value: dateValue, name: keys[i] };
          filterData.push(data);
        } else if (element.operator && element.condition1) {
          const data = {
            title: currentColumn?.Header || _.startCase(keys[i]),
            value: element?.condition1?.filter?.map((e) => e?.optionLabel)?.toString(),
            name: keys[i]
          };
          filterData.push(data);
        } else {
          const data = { title: currentColumn?.Header || _.startCase(keys[i]), value: element.filter, name: keys[i] };
          filterData.push(data);
        }
      }
      setChipData(filterData);
    }
  };

  const filterModel = customFilters

  useEffect(() => {
    if (filterModel) {
      if (!oldModalRef.current || !_.isEqual(filterModel, oldModalRef.current || {})) oldModalRef.current = filterModel;
      chipDataSetter(filterModel);
    }
  }, [ _.isEqual(filterModel, oldModalRef.current || {})]);

  const hideElementAndShowNumber = (container) => {
    const childItems = [...container?.children];

    childItems.forEach((item) => (item.style.display = 'inline-flex'));
    let lastVisibleItem = null;
    const hiddenItems = [];
    for (let i = 0; i < childItems.length; i++) {
      const item = childItems[i] as HTMLDivElement;
      const isOverlapping = item.getBoundingClientRect().right >= container.getBoundingClientRect().right - COUNT_PADDING;
      if (isOverlapping) {
        hiddenItems.push(item);
        if (!lastVisibleItem) {
          lastVisibleItem = childItems[i - 1];
        }
      }
    }
    hiddenItems.forEach((item) => (item.style.display = 'none'));

    const count = hiddenItems.length;
    setHiddenItems(count);

    const deltaX = lastVisibleItem?.offsetLeft + lastVisibleItem?.clientWidth;

    if (countRef.current) {
      countRef.current.style.cssText = `
      left: ${deltaX + COUNT_PADDING}px;
      display: ${count === 0 ? 'none' : 'block'};
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      `;
    }
  };

  useEffect(() => {
    if (isAppliedFilterPresent || chipData?.length > 0) {
      setIsFilterPresent(true);
    } else {
      setIsFilterPresent(false);
    }
  }, [isAppliedFilterPresent, chipData]);


  return (
    <div className="">
      {isAppliedFilterPresent ? (
        <div className="chip-container">
          <Chip
            onClick={handleFilterOpen}
            className={'filter-chip'}
            deleteIcon={<CloseIcon />}
            label={selectedFilter?.title}
            onDelete={clearFilterAll}
          />
        </div>
      ) : (
        chipData?.length > 0 && (
          <div className="chip-container" style={{ paddingRight: `${55 + COUNT_PADDING}px` }}>
            <div className={'chip-group'} ref={containerRef}>
              {chipData?.map((filter) => (
                <Chip
                  onClick={handleFilterOpen}
                  className={'filter-chip'}
                  deleteIcon={<CloseIcon />}
                  label={`${filter?.title}=${filter?.value}`}
                  onDelete={() => clearSingleFilter(filter.name)}
                />
              ))}
            </div>

            <div
              ref={countRef}
              style={{ cursor: 'pointer', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
              onClick={handleFilterOpen}
            >
              +{hiddenItems} more
            </div>
          </div>
        )
      )}
    </div>
  );
};
