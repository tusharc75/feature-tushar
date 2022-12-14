import React from 'react';
import moment from 'moment';
import { AiOutlineLoading } from 'react-icons/ai';
import CustomRenderCell from '../Helpers/CustomRenderCell';
import NoDataCell from '../Helpers/NoDataCell';
import { dateFormat, dateTimeFormat } from '../../constants/helpers';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from 'react-router-dom';

type RendererTypes = 'date' | 'common';


export const getRenderer = (rendererName: RendererTypes) => {
  switch (rendererName) {
    case 'date':
      return (row) => {
        return row?.value ? (
          <h5 className="createBy" title={`${moment(row?.value.slice(0, 10)).format(dateFormat)}`}>
            {moment(row?.value?.slice(0, 10))?.format(dateFormat)}
          </h5>
        ) : (
          <NoDataCell />
        );
      };
    case 'common':
      return (row) => {
        return <CustomRenderCell value={row?.value} />;
      };
  }
};
