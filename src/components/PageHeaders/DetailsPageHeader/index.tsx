import { Button, ButtonProps, Menu, useMediaQuery } from '@material-ui/core';
import React, { ReactNode, useState } from 'react';
import type { PreviewDownloadProps } from './PreviewDownload';
import { Add, ExpandMore } from '@material-ui/icons';
import PreviewDownload from './PreviewDownload';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

type ButtonPropsWithTooltip = {
  tooltip?: string;
} & ButtonProps;

type DetailsPageHeaderProps = {
  isAddButtonVisible: boolean;
  addButtonMenuItems?: ReactNode;
  addButtonProps?: ButtonPropsWithTooltip;
  isActionButtonVisible: boolean;
  actionButtonMenuItems?: ReactNode;
  actionButtonProps?: ButtonPropsWithTooltip;
  previewDownloadProps?: PreviewDownloadProps | undefined | null;
  leftSideContents?: ReactNode;
  rightSideContents?: ReactNode;
  hasXpadding?: boolean;
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
  hasXpadding = true
}: DetailsPageHeaderProps) => {
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');

  const openActions = (event) => {
    setActionAnchorEl(event.currentTarget);
  };
  const closeActions = () => {
    setActionAnchorEl(null);
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };
  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  const { tooltip: actionButtonTooltip, ...restOfActionButtonProps } = actionButtonProps || {};
  const { tooltip: addButtonTooltip, ...restOfAddButtonProps } = addButtonProps || {};

  return (
    <div className={`flex details-page-header flex-wrap justify-between items-center gap-2 py-2 ${hasXpadding ? 'px-2' : ''}`}>
      <div className="flex flex-wrap gap-2 items-center">
        {isAddButtonVisible ? (
          <>
            <HtmlTooltip title={addButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  variant={isMobile ? 'text' : 'outlined'}
                  color="primary"
                  size="small"
                  startIcon={isMobile ? null : <Add />}
                  onClick={openAddActions}
                  {...restOfAddButtonProps}
                  aria-controls="add-menu"
                  className={`${isMobile ? 'btn-outline-v1  with-border' : ''}`}
                  endIcon={isMobile ? null : <ExpandMore fontSize="small" />}
                >
                  {isMobile ? <Add /> : 'Add'}
                </Button>
              </span>
            </HtmlTooltip>
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
              onClose={closeAddActions}
            >
              <span onClick={closeAddActions}>{addButtonMenuItems}</span>
            </Menu>
          </>
        ) : null}
        {leftSideContents}
      </div>
      <div className="flex flex-wrap gap-2 items-center ml-auto">
        {previewDownloadProps ? <PreviewDownload {...previewDownloadProps} /> : null}
        {rightSideContents}
        {isActionButtonVisible ? (
          <>
            <HtmlTooltip title={actionButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  aria-controls="action-menu"
                  className="new-dropdown-v1"
                  {...restOfActionButtonProps}
                >
                  {'Actions'}
                  <ExpandMore fontSize="small" />
                </Button>
              </span>
            </HtmlTooltip>
            <Menu
              anchorEl={actionAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(actionAnchorEl)}
              onClose={closeActions}
            >
              <span onClick={() => closeActions()}>{actionButtonMenuItems}</span>
            </Menu>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DetailsPageHeader;
