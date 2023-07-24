import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import CopyToClipboard from 'src/components/Helpers/CopyToClipboard';

function DisplayData({ label, value, icon, highlightsHead = false, showCopyToText = false }) {
  return (
    <div>
      <List style={{ padding: 0 }}>
        <ListItem style={{ alignItems: 'flex-start', paddingInline: '0' }}>
          <ListItemIcon style={{ minWidth: '24px', marginTop: 11 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={
              highlightsHead ? (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    fontWeight: 600
                  }}
                  className="truncate max-w-full dark:bg-[rgb(70,70,108)] bg-[#EFFBF9] text-[#298B88] dark:text-white"
                >
                  {showCopyToText ? <CopyToClipboard textToCopy={value ? value : '-'} /> : value ? value : '-'}
                </span>
              ) : value ? (
                <span style={{ fontSize: '15px' }} className="truncate  max-w-full">
                  {' '}
                  {showCopyToText ? (
                    <>
                      {value}
                      <CopyToClipboard textToCopy={value} />
                    </>
                  ) : (
                    value
                  )}
                </span>
              ) : (
                '-'
              )
            }
            secondary={<span style={{ fontSize: '14px' }}>{label}</span>}
          />
        </ListItem>
      </List>
    </div>
  );
}

export default DisplayData;
