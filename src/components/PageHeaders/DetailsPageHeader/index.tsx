import { Button, ButtonProps, Menu, useMediaQuery } from '@material-ui/core';
import React, { ReactNode, useState } from 'react';
import type { PreviewDownloadProps } from './PreviewDownload';
import { Add, ExpandMore, TouchApp } from '@material-ui/icons';
import PreviewDownload from './PreviewDownload';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SendEmail, { SendEmailProps } from './sendEmail';

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
  sendEmailProps?: SendEmailProps;
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
  sendEmailProps,
  hasXpadding = true
}: DetailsPageHeaderProps) => {
  const { tooltip: actionButtonTooltip, onClick: actionButtonOnClick, ...restOfActionButtonProps } = actionButtonProps || {};
  const { tooltip: addButtonTooltip, onClick: addButtonOnClick, ...restOfAddButtonProps } = addButtonProps || {};

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
    <div className={`flex details-page-header flex-wrap justify-between items-center gap-2 py-2 ${hasXpadding ? 'px-2' : ''}`}>
      <div className="flex flex-wrap gap-2 items-center flex-grow">
        {isAddButtonVisible ? (
          <>
            <HtmlTooltip title={addButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
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
            >
              <span onClick={closeAddMenu}>{addButtonMenuItems}</span>
            </Menu>
          </>
        ) : null}
        {leftSideContents}
      </div>
      <div className="flex flex-wrap gap-2 items-center ml-auto">
        {previewDownloadProps ? <PreviewDownload {...previewDownloadProps} /> : null}
        {sendEmailProps ? <SendEmail {...sendEmailProps} /> : null}
        {rightSideContents}
        {isActionButtonVisible ? (
          <>
            <HtmlTooltip title={actionButtonTooltip ?? ''} arrow placement="top" enterTouchDelay={0}>
              <span>
                <Button
                  variant={'outlined'}
                  color="default"
                  size="small"
                  onClick={ActionClick}
                  aria-controls="action-menu"
                  className="new-dropdown-v1 min-h-[30px] max-[600px]:[border:0px_!important] max-[600px]:[max-width:36px_!important]"
                  {...restOfActionButtonProps}
                >
                  {isMobile ? (
                    <TouchApp />
                  ) : (
                    <>
                      Actions <ExpandMore fontSize="small" />
                    </>
                  )}
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
