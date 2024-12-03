import { Button, ButtonProps, CircularProgress, Menu, useMediaQuery } from '@material-ui/core';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import queryString from 'query-string';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { FaCircleChevronDown } from 'react-icons/fa6';
import { useHistory } from 'react-router-dom';
import { SearchFilter } from 'src/components/SearchFilter';
import HtmlTooltip from '../CustomTooltipTitle';
import SearchBox from '../Helpers/SearchBox';
import HideWhenOffline from '../HideWhenOffline';
import { cn } from 'src/constants/helpers';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';

type ButtonPropsWithExtraData = {
  tooltip?: string;
  loading?: boolean;
  iconsEnabled?: boolean;
  text?: string;
  textAddShow?: boolean
} & ButtonProps;

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
  leftSideContentsOfSearchFilter?: ReactNode;
  isActionButtonVisible: boolean;
  actionButtonProps?: Omit<ButtonPropsWithExtraData, 'text'>;
  actionMenuItems?: ReactNode;
  addButtonProps?: ButtonPropsWithExtraData;
  addButtonOnclick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isAddButtonVisible: boolean;
  setQueryString?: boolean;
  showSearchInMobile?: boolean;
} & React.ComponentProps<'div'>;

const ListingPageHeader = ({
  toggleButtonList,
  onToggle,
  setQueryString = true,
  selectedType,
  setSelectedType,

  leftSideContents,
  rightSideContents,
  leftSideContentsOfSearchFilter,

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
  showSearchInMobile = false
}: ListingPageHeaderProps) => {
  const walkmeInstance = useGetWalkmeInstance();
  const isMobile = useMediaQuery('(max-width:600px)');
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [locationKeys, setLocationKeys] = useState([]);

  const {
    tooltip: actionButtonTooltip,
    loading: actionButtonLoading,
    disabled: actionButtonDisabled,
    iconsEnabled: actionButtonIconsEnabled = true,
    ...restOfActionButtonProps
  } = actionButtonProps;
  const {
    tooltip: addButtonTooltip,
    loading: addButtonLoading,
    disabled: addButtonDisabled,
    iconsEnabled: addButtonIconsEnabled = true,
    text: addButtonText = '',
    textAddShow = false,
    ...restOfAddButtonProps
  } = addButtonProps;

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
    if (type && setSelectedType) setSelectedType(parseInt(type));

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

  const renderButtonText = ({ text, startIcon = null, loading, iconText = null, endIcon = null, mobileIcon = null }) => {
    if (isMobile) {
      return (
        <>
          <span className={`${loading ? 'sr-only' : ''} flex items-center`}>
            {mobileIcon}
            {iconText ? iconText : null}
          </span>
          <CircularProgress size={20} color="inherit" className={`${loading ? '' : 'sr-only'} `} />
        </>
      );
    } else {
      return (
        <>
          <span className={` flex items-center`}>
            {startIcon && <span className={`-ml-1 [&>*]:[font-size:20px_!important]`}>{startIcon}</span>}
            {text && <span className={``}>{text}</span>}
            {iconText && <span className={`${loading ? 'sr-only' : 'ml-1'}`}>{iconText}</span>}
            {endIcon && <span className={`-mr-1 [&>*]:[font-size:20px_!important]`}>{endIcon}</span>}
          </span>
          <CircularProgress size={20} color="inherit" className={`${loading ? '' : 'sr-only'} ml-2`} />
        </>
      );
    }
  };

  const shouldNotFlexWrap = useMemo(() => {
    return onSearch && (isAddButtonVisible || isActionButtonVisible) && !Boolean(rightSideContents);
  }, [isActionButtonVisible, isAddButtonVisible, onSearch, rightSideContents]);

  const isLeftSidePresent = useMemo(() => {
    return Boolean(toggleButtonList) || Boolean(leftSideContents);
  }, [toggleButtonList, leftSideContents]);

  return (
    <div className="header-panel listing-head">
      <div className="flex items-start gap-2 [flex-wrap:wrap] lg:flex-nowrap">
        <div className={'flex flex-grow flex-wrap items-center gap-2'}>
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
        <div
          className={`flex flex-grow ${shouldNotFlexWrap ? '' : 'flex-wrap'} items-center justify-end gap-[8px] ${cn(showSearchInMobile ? 'max-[600px]:pt-2' : '')} ${!isLeftSidePresent && isMobile ? '-mt-2' : ''
            }`}
        >
          {Boolean(leftSideContentsOfSearchFilter) ? leftSideContentsOfSearchFilter : null}
          {onSearch ? (
            <HideWhenOffline>
              <SearchBox
                className={cn(showSearchInMobile ? '' : 'max-[600px]:hidden')}
                containerProps={{ className: cn(showSearchInMobile ? '' : 'max-[600px]:hidden') }}
                onChange={onSearch}
                value={searchValue}
              />
            </HideWhenOffline>
          ) : null}
          {handleSearchFilter ? (
            <SearchFilter
              className=" w-[250px] flex-grow sm:w-[300] sm:min-w-[200px] sm:max-w-[400px]"
              handleChangeFilter={handleSearchFilter}
              filter={searchFilter}
              chip={{ size: 'small' }}
              activityName="note"
            />
          ) : null}
          {rightSideContents || isAddButtonVisible || isActionButtonVisible ? (
            <>
              <div className="flex min-w-fit flex-wrap items-center gap-[8px]">
                {isAddButtonVisible ? (
                  <HtmlTooltip title={addButtonTooltip ?? ''} placement="top" arrow enterTouchDelay={0}>
                    <Button
                      variant={'contained'}
                      color="primary"
                      size="small"
                      id={showSearchInMobile ? 'dialog-add-button' : 'add-button'}
                      disabled={addButtonLoading || addButtonDisabled}
                      {...restOfAddButtonProps}
                      onClick={(e) => {
                        addButtonOnclick && addButtonOnclick(e);
                      }}
                      className={`no-shadow ${addButtonLoading ? '' : ''} min-h-[32px] max-[600px]:[padding:4px_!important]`}
                      startIcon={isMobile ? null : addButtonIconsEnabled ? <AddOutlined /> : null}
                    >
                      {renderButtonText({
                        text: textAddShow ? 'Add' : `Create`,
                        loading: addButtonLoading,
                        iconText: addButtonText,
                        mobileIcon: <AddOutlined />
                      })}
                    </Button>
                  </HtmlTooltip>
                ) : null}
                <HideWhenOffline>
                  {isActionButtonVisible ? (
                    <>
                      <HtmlTooltip title={actionButtonTooltip ?? ''} placement="top" arrow enterTouchDelay={0}>
                        <span>
                          <Button
                            variant={'outlined'}
                            color="default"
                            size="small"
                            id={showSearchInMobile ? 'dialog-action-button' : 'action-button'}
                            className={`new-dropdown-v1 [height:32px_!important] max-[600px]:[border:0px_!important] max-[600px]:[max-width:36px_!important]`}
                            disabled={actionButtonLoading || actionButtonDisabled}
                            {...restOfActionButtonProps}
                            onClick={openActions}
                            aria-controls="action-menu"
                            endIcon={isMobile ? null : actionButtonIconsEnabled ? <ExpandMore /> : null}
                          >
                            {renderButtonText({
                              text: 'Actions',
                              loading: actionButtonLoading,
                              mobileIcon: (
                                <span className="h-[16px] w-[20px]">
                                  <FaCircleChevronDown size={16} />
                                </span>
                              )
                            })}
                          </Button>
                        </span>
                      </HtmlTooltip>
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
                        TransitionProps={{ unmountOnExit: true, timeout: walkmeInstance ? 0 : 200 }}
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
