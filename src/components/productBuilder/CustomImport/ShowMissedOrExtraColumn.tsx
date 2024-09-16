import React, { useEffect, useState } from 'react';
import { Box, IconButton, Popover } from '@material-ui/core';
import IconWithPulse from 'src/components/IconWithPulse';
import InfoIcon from '@material-ui/icons/Info';
import { handleFileImport } from 'src/components/productBuilder/CustomImport/helper';
import { read, utils } from 'xlsx';
import { makeStyles } from '@material-ui/styles';

const useClasses = makeStyles(() => ({
  table: {
    borderCollapse: 'collapse'
  },
  td: {
    border: '1px solid #dddddd',
    textAlign: 'left',
    padding: '5px'
  }
}));

const ShowMissedOrExtraColumn = ({ view, file }) => {
  const classes = useClasses();

  const [extraColumn, setExtraColumn] = useState([]);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const getHeader = async (values) => {
    const _file = await handleFileImport(file, values);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      let readedData = read(data, { type: 'array' });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const jsonData = utils.sheet_to_json(ws, { header: 1 });

      let headers: any = jsonData[0];

      headers = headers?.reduce((result, curr) => {
        if (curr == null) {
          return result;
        }
        result.push(curr);
        return result;
      }, []);

      const extraColumn = headers?.filter((item) => !view?.importedColumnHeader?.includes(item)) || [];
      setExtraColumn(extraColumn);
    };
    reader.readAsArrayBuffer(_file);
  };

  useEffect(() => {
    if (view) {
      getHeader(view?.sheet);
    }
  }, [view]);

  return (
    <>
      {view && extraColumn?.length > 0 && (
        <IconWithPulse>
          <IconButton
            size="small"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              setAnchorEl(e.currentTarget);
            }}
          >
            <InfoIcon fontSize="small" color={'primary'} />{' '}
          </IconButton>
        </IconWithPulse>
      )}

      <Popover
        id={'simple-popover'}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => {
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Box display={'flex'} p={1}>
          {extraColumn && extraColumn?.length > 0 ? (
            <Box className="max-h-[300px] min-h-[100px] overflow-auto">
              <table className={classes.table}>
                <tr>
                  <th className={classes.td}>Extra Column</th>
                </tr>
                {extraColumn?.map((d) => {
                  return (
                    <tr>
                      <td className={classes.td}>{d}</td>
                    </tr>
                  );
                })}
              </table>
            </Box>
          ) : null}
        </Box>
      </Popover>
    </>
  );
};

export default ShowMissedOrExtraColumn;
