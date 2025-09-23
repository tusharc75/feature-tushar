import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Grid from '@mui/material/Grid';
import { Fragment, useEffect, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Activity from '.';
import HideWhenOffline from '../HideWhenOffline';
import { cn, sidebarResource } from 'src/constants/helpers';
import { startCase } from 'lodash';

const ActivityButton = ({
  referenceId,
  resource,
  resourceLabel = '',
  resourceData = null,
  extraRelatedTo = null,
  handleClose = null,
  extraData = {},
  fromDialog = false
}) => {
  const [showActivity, setActivityShow] = useState(false);

  useEffect(() => {
    if (showActivity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.removeProperty('overflow');
      if (handleClose) {
        handleClose();
      }
    }
  }, [showActivity]);

  const {
    state: { permissions }
  }: any = useData();
  return (
    <Fragment>
      <HideWhenOffline>
        <ThemeButton endIcon={<ArrowForwardIcon />} id="collaborator-button" onClick={() => setActivityShow(!showActivity)} buttonType="theme">
          Workspace
        </ThemeButton>
      </HideWhenOffline>
      {showActivity && <div className="fixed inset-0 z-[6] bg-black/30" onClick={() => setActivityShow(false)}></div>}
      <div className={cn(`activity-new-v1`, showActivity ? 'show-activity-v1' : 'hide-activity-v1', fromDialog ? '[--from_top:54px]' : '')}>
        <Grid container>
          <Grid item xs={12}>
            <div>
              {showActivity && (
                <Activity
                  resourceId={referenceId}
                  resourceLabel={resourceLabel}
                  resource={resource}
                  restrictedAddActivities={
                    permissions && permissions[`${resource}`] && permissions[`${resource}`].isUpdate ? [] : ['Attachment', 'Case']
                  }
                  relatedTo={[
                    {
                      type: resource,
                      referenceId: referenceId,
                      access: true,
                      ...extraData
                    }
                  ]}
                  extraRelatedTo={
                    extraRelatedTo
                      ? {
                        type: extraRelatedTo?.resource,
                        referenceId: extraRelatedTo?.referenceId,
                        access: true
                      }
                      : null
                  }
                  newRelatedTo={[{ resource: sidebarResource[resource] || startCase(resource), referenceId: referenceId, label: resourceLabel, ...extraData }]}
                  newExtraRelatedTo={extraRelatedTo ? [{ resource: sidebarResource[extraRelatedTo?.resource] || startCase(extraRelatedTo?.resource), referenceId: extraRelatedTo?.referenceId, label: extraRelatedTo?.label }] : []}
                  close={() => setActivityShow(false)}
                  handleActivityRefresh={() => { }}
                  emails={[]}
                  resourceData={resourceData}
                />
              )}
            </div>
          </Grid>
        </Grid>
      </div>
    </Fragment>
  );
};

export default ActivityButton;
