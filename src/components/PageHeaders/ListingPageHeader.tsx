import { AddOutlined } from '@mui/icons-material';
import { ButtonProps, CircularProgress, Popover, useMediaQuery } from '@mui/material';
import queryString from 'query-string';
import React, { ReactNode, useEffect, useMemo } from 'react';
import { BiChevronDown } from 'react-icons/bi';
import { useHistory } from 'react-router-dom';
// import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import useSearch from 'src/components/Header/SearchBar/useSearch';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import ActionButtonWithMenu from 'src/components/PageHeaders/ActionButtonWithMenu';
import RippleButton from 'src/components/RippleButton';
import { SearchFilter } from 'src/components/SearchFilter';
import { cn, TAB_VIEWS } from 'src/constants/helpers';
import HtmlTooltip from '../CustomTooltipTitle';
import SearchBox from '../Helpers/SearchBox';
import HideWhenOffline from '../HideWhenOffline';
import { useLocation } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { Star, StarBorder } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useData } from 'src/StateProvider/Provider';
import { SET_USER } from 'src/StateProvider/actionTypes';

type ButtonPropsWithExtraData = {
  tooltip?: string;
  loading?: boolean;
  iconsEnabled?: boolean;
  text?: string;
  textAddShow?: boolean;
  customTextAdd?: string;
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
  rightSideContentsBeforeAction?: ReactNode;
  leftSideContentsOfSearchFilter?: ReactNode;
  isActionButtonVisible: boolean;
  actionButtonProps?: Omit<ButtonPropsWithExtraData, 'text'>;
  actionMenuItems?: ReactNode;
  addButtonProps?: ButtonPropsWithExtraData;
  addButtonOnclick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isAddButtonVisible: boolean;
  setQueryString?: boolean;
  showSearchInMobile?: boolean;
  resource?: string;
} & React.ComponentProps<'div'>;

const ListingPageHeader = ({
  toggleButtonList,
  onToggle,
  setQueryString = true,
  selectedType,
  setSelectedType,
  leftSideContents,
  rightSideContents,
  rightSideContentsBeforeAction,
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
  showSearchInMobile = false,
  resource = null
}: ListingPageHeaderProps) => {
  // const walkmeInstance = useGetWalkmeInstance();
  const isMobile = useMediaQuery('(max-width:600px)');
  const history = useHistory();
  const { search: locationSearch } = useLocation();
  const { setGlobalSearch } = useSearch();

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
    customTextAdd = null,
    ...restOfAddButtonProps
  } = addButtonProps;

  const handleToggle = (event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>, data: { key: string; value: number }) => {
    const newData = data.value;
    if (setQueryString) history.push(`?type=${newData}`);
    setSelectedType && setSelectedType(newData);
    onToggle && onToggle(event, data.key);
  };

  useEffect(() => {
    const { type }: any = queryString.parse(locationSearch);
    const selectedTypeExist = toggleButtonList?.find((d) => d.value === parseInt(type));
    if (type && setSelectedType && selectedTypeExist) setSelectedType(parseInt(type));
  }, [locationSearch, toggleButtonList]);

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
        {toggleButtonList || leftSideContents ? (
          <>
            <div className={'flex flex-grow flex-wrap items-center gap-2'}>
              {toggleButtonList ? (
                <HideWhenOffline>
                  <RenderTabs handleToggle={handleToggle} selectedType={selectedType} toggleButtonList={toggleButtonList} resource={resource} />
                </HideWhenOffline>
              ) : null}
              {leftSideContents ? <HideWhenOffline>{leftSideContents}</HideWhenOffline> : null}
            </div>
          </>
        ) : null}
        <div className={`flex flex-grow ${shouldNotFlexWrap
          && !leftSideContentsOfSearchFilter ? '' : 'flex-wrap'} items-center justify-end gap-[8px] ${cn(showSearchInMobile ? 'max-[600px]:pt-2' : '')} ${!isLeftSidePresent && isMobile ? '-mt-2' : ''}`}
        >
          {Boolean(leftSideContentsOfSearchFilter) ? leftSideContentsOfSearchFilter : null}
          {onSearch ? (
            <HideWhenOffline>
              <SearchBox
                className={cn(showSearchInMobile ? '' : 'max-[600px]:hidden')}
                containerProps={{ className: cn(showSearchInMobile ? '' : 'max-[600px]:hidden') }}
                onChange={(e) => {
                  onSearch(e);
                  if (e?.target?.value === '') setGlobalSearch('');
                }}
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
          {rightSideContents || rightSideContentsBeforeAction || isAddButtonVisible || isActionButtonVisible ? (
            <>
              <div className="flex min-w-fit flex-wrap items-center gap-[8px]">
                {isAddButtonVisible ? (
                  <HtmlTooltip title={addButtonTooltip ?? ''} placement="top" arrow enterTouchDelay={0}>
                    <ThemeButton
                      buttonType="theme"
                      id={showSearchInMobile ? 'dialog-add-button' : 'add-button'}
                      disabled={addButtonDisabled}
                      {...restOfAddButtonProps}
                      onClick={(e) => {
                        addButtonOnclick && addButtonOnclick(e);
                      }}
                      isLoading={addButtonLoading}
                      startIcon={isMobile ? null : addButtonIconsEnabled ? <AddOutlined /> : null}
                    >
                      {renderButtonText({
                        text: customTextAdd ? customTextAdd : textAddShow ? 'Add' : `Create`,
                        loading: false,
                        iconText: addButtonText,
                        mobileIcon: <AddOutlined fontSize="small" />
                      })}
                    </ThemeButton>
                  </HtmlTooltip>
                ) : null}
                {rightSideContentsBeforeAction ? rightSideContentsBeforeAction : null}
                <HideWhenOffline>
                  {isActionButtonVisible ? (
                    <>
                      <ActionButtonWithMenu
                        actionMenuItems={actionMenuItems}
                        tooltip={actionButtonTooltip}
                        showSearchInMobile={showSearchInMobile}
                        disabeled={actionButtonDisabled}
                        actionButtonIconsEnabled={actionButtonIconsEnabled}
                        loading={actionButtonLoading}
                        {...restOfActionButtonProps}
                      />
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

const RenderTabs = ({
  toggleButtonList,
  handleToggle,
  selectedType,
  resource
}: {
  handleToggle: (
    event: React.MouseEvent<HTMLElement, globalThis.MouseEvent>,
    data: {
      key: string;
      value: number;
    }
  ) => void;
} & Pick<ListingPageHeaderProps, 'toggleButtonList' | 'selectedType' | 'resource'>) => {
  const {
    state,
    dispatch
  }: any = useData();
  const { user } = state;
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [defaultType, setDefaultType] = React.useState<number | null>(selectedType);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleSetDefault = async (value: number) => {
    setDefaultType(value);
    try {
      await axiosInstance().put('/user/resource-ui-preference', {
        resource: resource,
        type: TAB_VIEWS[value],
      }).then(({ data: { data } }) => {
        dispatch({
          type: SET_USER, payload: {
            ...user,
            user: {
              ...user.user,
              uiPreference: {
                ...user.uiPreference,
                byDefaultRecord: data,
              },
            },
          },
        });
      })
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <RippleButton
        className="flex items-center gap-1 rounded-[6px] bg-theme p-[4px_5px_4px_10px] text-[13px] font-medium leading-[22.4px] text-[white] outline-transparent focus-within:outline-transparent focus-visible:outline-transparent "
        onClick={handleClick}
      >
        {toggleButtonList[selectedType - 1]?.key || toggleButtonList[0]?.key}
        <BiChevronDown size={22} className={cn('transition-transform', open ? '[transform:rotate(180deg)]' : '')} />
      </RippleButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <ul className="list-none py-1">
          {toggleButtonList?.map((d) => {
            const isActive = toggleButtonList[selectedType - 1]?.value === d.value;
            return (
              <li key={d.value}
                className={cn("flex items-center justify-between px-2", "hover:bg-gray-200 dark:hover:bg-gray-900", isActive ? "bg-gray-200 dark:bg-gray-900" : "")}
              >
                <RippleButton className="flex-1 text-left px-2 py-2"
                  component="div"
                  onClick={(e) => {
                    handleClose();
                    handleToggle(e, d);
                  }}
                >
                  {d.key}
                </RippleButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(d.value);
                  }}
                >
                  {defaultType === d.value ? (
                    <Star sx={{ color: 'gold' }} fontSize="small" />
                  ) : (
                    <StarBorder fontSize="small" />
                  )}
                </IconButton>
              </li>
            );
          })}
        </ul>
      </Popover>
    </>
  );
};
