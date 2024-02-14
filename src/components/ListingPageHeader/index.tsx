import { Button, ButtonProps, Menu } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import queryString from 'query-string';
import React, { ReactNode, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import SearchBox from '../Helpers/SearchBox';
import HideWhenOffline from '../HideWhenOffline';
import { SearchFilter } from 'src/components/SearchFilter';

type ListingPageHeaderProps = {
  toggleButtonList?: { key: string; value: number }[];
  onToggle?: (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, value: string) => void;
  selectedType?: number;
  setSelectedType?: (value: number) => void;
  leftSideContents?: ReactNode;
  searchValue?: string;
  onSearch?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  searchFilter?: any[];
  handleSearchFilter?: (value: any) => void;
  rightSideContents?: ReactNode;
  isActionButtonVisible: boolean;
  actionButtonProps?: ButtonProps;
  actionMenuItems?: ReactNode;
  addButtonProps?: ButtonProps;
  addButtonOnclick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isAddButtonVisible: boolean;
  setQueryString?: boolean;
  synchronizeType?: boolean;
} & React.ComponentProps<'div'>;

const ListingPageHeader = ({
  toggleButtonList,
  onToggle,
  setQueryString = true,
  selectedType,
  setSelectedType,

  leftSideContents,
  rightSideContents,

  searchValue,
  onSearch,

  searchFilter,
  handleSearchFilter,

  addButtonOnclick,
  isAddButtonVisible,
  addButtonProps = {},

  isActionButtonVisible,
  actionButtonProps = {},
  actionMenuItems,
  synchronizeType = false
}: ListingPageHeaderProps) => {
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [locationKeys, setLocationKeys] = useState([]);

  const handleToggle = (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, value: string) => {
    const data = toggleButtonList.find((d) => d.key === value).value;
    if (setQueryString) history.push(`?type=${data}`);
    setSelectedType && setSelectedType(data);
    onToggle && onToggle(event, value);
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const { type }: any = queryString.parse(history.location.search);
    if (synchronizeType && setSelectedType) setSelectedType(type ? parseInt(type) : 1);

    return history.listen((location) => {
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setSelectedType && setSelectedType(type ? parseInt(type) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setSelectedType && setSelectedType(type ? parseInt(type) : 1);
        }
      }
    });
  }, [locationKeys]);

  return (
    <div className="header-panel listing-head">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className={'flex flex-wrap items-center gap-2 w-full'}>
          {toggleButtonList ? (
            <HideWhenOffline>
              <ToggleButtonGroup
                size="small"
                className="align-items-center"
                value={toggleButtonList[selectedType - 1].key}
                exclusive
                onChange={(e, value) => handleToggle(e, value)}
              >
                {toggleButtonList.map((k, index) => {
                  return (
                    <ToggleButton value={k.key} key={index}>
                      {k.key}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </HideWhenOffline>
          ) : null}
          {leftSideContents ? <HideWhenOffline>{leftSideContents}</HideWhenOffline> : null}
        </div>
        <div className="flex flex-wrap gap-[8px] justify-end items-center">
          {onSearch ? (
            <HideWhenOffline>
              <SearchBox onChange={onSearch} value={searchValue} size="small" />
            </HideWhenOffline>
          ) : null}
          {handleSearchFilter ? (
            <SearchFilter className='w-full sm:w-[unset] sm:max-w-[400px] sm:min-w-[200px] flex-grow' handleChangeFilter={handleSearchFilter} filter={searchFilter} chip={{ size: 'small' }} activityName="note" />
          ) : null}
          {rightSideContents || isAddButtonVisible || isActionButtonVisible ? (
            <>
              <div className="flex gap-[8px] flex-wrap items-center">
                <HideWhenOffline>
                  {isAddButtonVisible ? (
                    <Button
                      variant={'contained'}
                      color="primary"
                      size="small"
                      {...addButtonProps}
                      onClick={(e) => {
                        addButtonOnclick && addButtonOnclick(e);
                      }}
                      className={`no-shadow ${addButtonProps.className}`}
                      startIcon={<AddOutlined />}
                    >
                      Add
                    </Button>
                  ) : null}
                  {isActionButtonVisible ? (
                    <>
                      <Button
                        variant={'outlined'}
                        color="default"
                        size="small"
                        className={`new-dropdown-v1`}
                        {...actionButtonProps}
                        onClick={openActions}
                        aria-controls="action-menu"
                        endIcon={<ExpandMore />}
                      >
                        Actions
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left'
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}
                      >
                        <span onClick={() => closeActions()}>{actionMenuItems}</span>
                      </Menu>
                    </>
                  ) : null}
                </HideWhenOffline>
              </div>
              {rightSideContents ? rightSideContents : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ListingPageHeader;
