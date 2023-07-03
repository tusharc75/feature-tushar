import { Typography, GridProps } from '@material-ui/core';
import moment from 'moment';
import { CardInterface } from 'src/components/CustomTableWithCard';
import { dateTimeFormat, dateFormat } from 'src/constants/helpers';

const getUpdatedObject = (oldData, newData) => {
  const data = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
  const newObj = {};
  for (const key of data) {
    newObj[key] = newData[key] || oldData[key];
  }
  return newObj;
};

export interface ColumnInterface extends GridProps {
  field: string;
  headerName: string;
  cellRenderer:
    | 'linkRenderer'
    | 'commonRenderer'
    | 'dateTimeRenderer'
    | 'createdByRenderer'
    | 'updatedByRenderer'
    | 'dateRenderer'
    | 'linkColWithDate';
  cellRendererParams?: CellRendererParams;
  dateAccessor?: string;
}

interface CellRendererParams {
  openInNewTab: boolean;
  pathName: string;
  property: string;
}

interface FunctionInterface extends GridProps {
  columns: ColumnInterface[];
  exclude?: string[];
}

export const createBodyColumns = ({ columns, exclude = [], ...others }: FunctionInterface): CardInterface['bodyColumns'] => {
  const createdBodyColumns: CardInterface['bodyColumns'] = [];

  if (columns) {
    for (const item of columns) {
      if (exclude.includes(item.field)) {
        continue;
      }
      const { field, headerName, cellRenderer, cellRendererParams, dateAccessor, ...colProps } = item;
      const mergedProps = getUpdatedObject(others, colProps);

      if (cellRenderer === 'linkRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>
                  {row[`${field}`] ? (
                    <a
                      className="link"
                      href={`${cellRendererParams?.pathName}/${row?.[`${cellRendererParams?.property}`]}`}
                      target={`${cellRendererParams?.openInNewTab ? '_blank' : '_self'}`}
                    >
                      {row?.[`${field}`]}
                    </a>
                  ) : (
                    '---'
                  )}
                </Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'commonRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>{row[`${field}`] ? row?.[`${field}`] : '---'}</Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'dateTimeRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>{row[`${field}`] ? moment(row?.[`${field}`]).format(dateTimeFormat) : '---'}</Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'dateRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>{row[`${field}`] ? moment(row?.[`${field}`]).format(dateFormat) : '---'}</Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'createdByRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>{row[`${field}`] ? row?.[`${field}`] : '---'}</Typography>
                <Typography>
                  {row[`${dateAccessor ?? 'createdByDate'}`] ? moment(row?.[`${dateAccessor ?? 'createdByDate'}`]).format(dateTimeFormat) : '---'}
                </Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'updatedByRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>{row[`${field}`] ? row?.[`${field}`] : '---'}</Typography>
                <Typography>
                  {row[`${dateAccessor ?? 'updatedByDate'}`] ? moment(row?.[`${dateAccessor ?? 'updatedByDate'}`]).format(dateTimeFormat) : '---'}
                </Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
      if (cellRenderer === 'linkColWithDate') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{headerName}</Typography>
                <Typography>
                  {row[`${field}`] ? (
                    <a
                      className="link"
                      href={`${cellRendererParams?.pathName}/${row?.[`${cellRendererParams?.property}`]}`}
                      target={`${cellRendererParams?.openInNewTab ? '_blank' : '_self'}`}
                    >
                      {row?.[`${field}`]}
                    </a>
                  ) : (
                    '---'
                  )}
                </Typography>
                <Typography>
                  {row[`${dateAccessor ?? 'updatedByDate'}`] ? moment(row?.[`${dateAccessor ?? 'updatedByDate'}`]).format(dateTimeFormat) : '---'}
                </Typography>
              </>
            );
          },
          ...mergedProps
        });
      }
    }
  }

  return createdBodyColumns;
};
