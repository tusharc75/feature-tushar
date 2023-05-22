import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import CopyToClipboard from 'src/components/Helpers/CopyToClipboard';

function DisplayData({ label, value, icon, highlightsHead = false, showCopyToText = false }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List style={{ padding: 0 }}>
        <ListItem style={{ alignItems: 'flex-start', paddingInline: '0' }}>
          <ListItemIcon style={{ minWidth: '24px', marginTop: 11 }}>{icon}</ListItemIcon>
          <ListItemText
            primary={
              highlightsHead ? (
                <span
                  style={{
                    background: '#EFFBF9',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    color: '#298B88',
                    fontWeight: 600
                  }}
                >
                  {showCopyToText ? <CopyToClipboard textToCopy={value ? value : '-'} /> : value ? value : '-'}
                </span>
              ) : value ? (
                <span style={{ fontSize: '15px' }}> {showCopyToText ? <CopyToClipboard textToCopy={value} /> : value}</span>
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
