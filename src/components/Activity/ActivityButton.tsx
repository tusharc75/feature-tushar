import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Grid from '@mui/material/Grid';
import { Fragment, useEffect, useState } from 'react';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import Activity from '.';
import HideWhenOffline from '../HideWhenOffline';

const ActivityButton = ({ referenceId, resource, resourceLabel = '', extraRelatedTo = null, handleClose = null }) => {
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
        <ThemeButton
          borderColor="none"
          endIcon={<ArrowForwardIcon />}
          id="collaborator-button"
          onClick={() => setActivityShow(!showActivity)}
          color="primary"
        >
          Workspace
        </ThemeButton>
      </HideWhenOffline>
      {showActivity && <div className="backdrop-new-v1" onClick={() => setActivityShow(false)}></div>}
      <div className={`activity-new-v1 ${showActivity ? 'show-activity-v1' : 'hide-activity-v1'}`}>
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
                      access: true
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
                  close={() => setActivityShow(false)}
                  handleActivityRefresh={() => {}}
                  emails={[]}
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
