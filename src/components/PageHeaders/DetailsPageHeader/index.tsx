import { Button, ButtonProps, Menu, useMediaQuery } from '@mui/material';
import { Add, ExpandMore } from '@mui/icons-material';
import { ReactNode, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import PreviewDownload from 'src/components/PreviewDownload';
// import { MdExpandCircleDown } from 'react-icons/md';
import { FaCircleChevronDown } from 'react-icons/fa6';
import { useGetWalkmeInstance } from 'src/components/CustomIntro';
import NewActionButton, { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import { cn } from 'src/constants/helpers';

type ButtonPropsWithTooltip = {
  tooltip?: string;
  placement?: 'left' | 'right';
  introWrapper?: boolean;
  introWrapperTitle?: string;
  introWrapperContent?: string;
} & ButtonProps;

type DetailsPageHeaderProps = {
  isAddButtonVisible: boolean;
  isNewActionButtonVisible?: boolean;
  addButtonMenuItems?: ReactNode;
  addButtonProps?: ButtonPropsWithTooltip;
  isActionButtonVisible: boolean;
  actionButtonMenuItems?: ReactNode;
  actionButtonProps?: Omit<ButtonPropsWithTooltip, 'placement'>;
  previewDownloadProps?: any;
  leftSideContents?: ReactNode;
  rightSideContents?: ReactNode;
  hasXpadding?: boolean;
  newActionButtonProps?: NewActionButtonProps<any>;
  hasYpadding?: boolean;
  className?: string;
};

const DetailsPageHeader = ({
  isAddButtonVisible,
  addButtonMenuItems,
  addButtonProps,
  isActionButtonVisible,
  actionButtonMenuItems,
  actionButtonProps,
  previewDownloadProps,
  leftSideContents,
  rightSideContents,
  hasXpadding = true,
  isNewActionButtonVisible = false,
  newActionButtonProps,
  hasYpadding = true,
  className = ''
}: DetailsPageHeaderProps) => {
  const walkmeInstance = useGetWalkmeInstance();
  const { tooltip: actionButtonTooltip, onClick: actionButtonOnClick, ...restOfActionButtonProps } = actionButtonProps || {};
  const { tooltip: addButtonTooltip, onClick: addButtonOnClick, placement = 'left', ...restOfAddButtonProps } = addButtonProps || {};

  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const ActionClick = (event) => {
    if (typeof actionButtonOnClick === 'function') {
      actionButtonOnClick(event);
    } else {
      setActionAnchorEl(event.currentTarget);
    }
  };
  const closeActionMenu = () => {
    setActionAnchorEl(null);
  };

  const AddClick = (event) => {
    if (typeof addButtonOnClick === 'function') {
      addButtonOnClick(event);
    } else {
      setAddAnchorEl(event.currentTarget);
    }
  };
  const closeAddMenu = () => {
    setAddAnchorEl(null);
  };

  return (
    <div
      className={cn(
        `details-page-header flex flex-wrap items-center justify-between gap-2`,
        hasXpadding ? 'px-2' : '',
        hasYpadding ? 'py-2' : '',
        className
      )}
    >
      <div className="flex flex-grow flex-wrap items-center gap-2">
        {isAddButtonVisible && placement === 'left' ? (
          <>
            <HtmlTooltip title={addButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  id={'add-menu-button'}
                  variant={isMobile ? 'text' : 'outlined'}
                  color="primary"
                  size="small"
                  startIcon={isMobile ? null : <Add />}
                  onClick={AddClick}
                  {...restOfAddButtonProps}
                  aria-controls="add-menu"
                  className={`${isMobile ? 'btn-outline-v1  with-border max-[600px]:[max-width:36px_!important]' : ''}`}
                  endIcon={isMobile ? null : addButtonOnClick ? null : <ExpandMore fontSize="small" />}
                >
                  {isMobile ? <Add /> : 'Add'}
                </Button>
              </span>
            </HtmlTooltip>
          </>
        ) : null}
        {isAddButtonVisible && (
          <Menu
            anchorEl={addAnchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="add-menu"
            open={Boolean(addAnchorEl)}
            onClose={closeAddMenu}
            TransitionProps={{ unmountOnExit: true, timeout: walkmeInstance ? 0 : 200 }}
          >
            <span onClick={closeAddMenu}>{addButtonMenuItems}</span>
          </Menu>
        )}
        {leftSideContents}
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {isAddButtonVisible && placement === 'right' ? (
          <>
            <HtmlTooltip title={addButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  variant={isMobile ? 'text' : 'outlined'}
                  color="primary"
                  id={'details-page-add-button'}
                  size="small"
                  startIcon={isMobile ? null : <Add />}
                  onClick={AddClick}
                  {...restOfAddButtonProps}
                  aria-controls="add-menu"
                  className={`${isMobile ? 'btn-outline-v1  with-border !min-w-fit max-[600px]:[max-width:36px_!important]' : ''}`}
                  endIcon={isMobile ? null : addButtonOnClick ? null : <ExpandMore fontSize="small" />}
                >
                  {isMobile ? <Add /> : 'Add'}
                </Button>
              </span>
            </HtmlTooltip>
          </>
        ) : null}
        {previewDownloadProps ? <PreviewDownload {...previewDownloadProps} /> : null}
        {rightSideContents}
        {isNewActionButtonVisible && <NewActionButton {...newActionButtonProps} />}
        {isActionButtonVisible ? (
          <>
            <HtmlTooltip title={actionButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  variant={'outlined'}
                  color="default"
                  id={'details-page-action-button'}
                  size="small"
                  onClick={ActionClick}
                  aria-controls="action-menu"
                  className="new-dropdown-v1 min-h-[30px] max-[600px]:min-h-[32px] max-[600px]:[border:0px_!important] max-[600px]:[max-width:36px_!important]"
                  {...restOfActionButtonProps}
                >
                  <span className="sr-only max-[600px]:not-sr-only max-[600px]:!h-[16px] max-[600px]:!w-[20px]">
                    <FaCircleChevronDown size={16} className="" />
                  </span>
                  <span className="not-sr-only flex max-[600px]:sr-only">
                    Actions <ExpandMore fontSize="small" />
                  </span>
                </Button>
              </span>
            </HtmlTooltip>
            <Menu
              anchorEl={actionAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              TransitionProps={{ unmountOnExit: true, timeout: walkmeInstance ? 0 : 200 }}
              id="add-menu"
              open={Boolean(actionAnchorEl)}
              onClose={closeActionMenu}
            >
              <span onClick={() => closeActionMenu()}>{actionButtonMenuItems}</span>
            </Menu>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DetailsPageHeader;
