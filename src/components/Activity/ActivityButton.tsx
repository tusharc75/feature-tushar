import React, { useState, useEffect, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { GetUpcomingActivity } from '../../axios/activity';
import Chip from '@material-ui/core/Chip';
import { ListRelatedTo } from './Helpers/ListRelatedTo';
import { displayDate } from '../../constants/helpers';
import { Button, IconButton } from '@material-ui/core';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import HideWhenOffline from '../HideWhenOffline';
import Activity from '.';
import { useData } from 'src/StateProvider/Provider';

const ActivityButton = ({ referenceId, resource }) => {
  const [showActivity, setActivityShow] = useState(false);

  useEffect(() => {
    if (showActivity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.removeProperty('overflow');
    }
  }, [showActivity]);

  const {
    state: { permissions }
  }: any = useData();
  return (
    <Fragment>
      <HideWhenOffline>
        <Button
          endIcon={<ArrowForwardIcon />}
          variant="contained"
          onClick={() => setActivityShow(!showActivity)}
          style={{ background: 'var(--new_theme_color)', color: 'white', boxShadow: '0px 5.44444px 27.2222px rgba(0, 0, 0, 0.06)' }}
        >
          Activities
        </Button>
      </HideWhenOffline>
      {showActivity && <div className="backdrop-new-v1" onClick={() => setActivityShow(false)}></div>}
      <div className={`activity-new-v1 ${showActivity ? 'show-activity-v1' : 'hide-activity-v1'}`}>
        <Grid container>
          <Grid item xs={12}>
            <div>
              {showActivity && (
                <Activity
                  resourceId={referenceId}
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
