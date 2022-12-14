import moment from 'moment';
import CustomRenderCell from '../Helpers/CustomRenderCell';
import NoDataCell from '../Helpers/NoDataCell';
import { dateFormat } from '../../constants/helpers';

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
