import { Typography, GridProps } from '@material-ui/core';
import moment from 'moment';
import { CardInterface } from 'src/components/CustomTableWithCard';
import { dateTimeFormat, dateFormat } from 'src/constants/helpers';

export interface ColumnInterface {
  field: string;
  headerName: string;
  cellRenderer: 'linkRenderer' | 'commonRenderer' | 'dateTimeRenderer' | 'createdByRenderer' | 'updatedByRenderer' | 'dateRenderer';
  cellRendererParams?: CellRendererParams;
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
      let col = {};
      if (exclude.includes(item.field)) {
        continue;
      }
      if (item.cellRenderer === 'linkRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>
                  {row[`${item.field}`] ? (
                    <a
                      className="link"
                      href={`${item.cellRendererParams?.pathName}/${row?.[`${item.cellRendererParams?.property}`]}`}
                      target="_blank"
                    >
                      {row?.[`${item.field}`]}
                    </a>
                  ) : (
                    '---'
                  )}
                </Typography>
              </>
            );
          },
          ...others
        });
      }
      if (item.cellRenderer === 'commonRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>{row[`${item.field}`] ? row?.[`${item.field}`] : '---'}</Typography>
              </>
            );
          },
          ...others
        });
      }
      if (item.cellRenderer === 'dateTimeRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>{row[`${item.field}`] ? moment(row?.[`${item.field}`]).format(dateTimeFormat) : '---'}</Typography>
              </>
            );
          },
          ...others
        });
      }
      if (item.cellRenderer === 'dateRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>{row[`${item.field}`] ? moment(row?.[`${item.field}`]).format(dateFormat) : '---'}</Typography>
              </>
            );
          },
          ...others
        });
      }
      if (item.cellRenderer === 'createdByRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>{row[`${item.field}`] ? row?.[`${item.field}`] : '---'}</Typography>
                <Typography>{row[`createdByDate`] ? moment(row?.[`createdByDate`]).format(dateTimeFormat) : '---'}</Typography>
              </>
            );
          },
          ...others
        });
      }
      if (item.cellRenderer === 'updatedByRenderer') {
        createdBodyColumns.push({
          render: (row) => {
            return (
              <>
                <Typography>{item.headerName}</Typography>
                <Typography>{row[`${item.field}`] ? row?.[`${item.field}`] : '---'}</Typography>
                <Typography>{row[`updatedByDate`] ? moment(row?.[`updatedByDate`]).format(dateTimeFormat) : '---'}</Typography>
              </>
            );
          },
          ...others
        });
      }
    }
  }

  return createdBodyColumns;
};
