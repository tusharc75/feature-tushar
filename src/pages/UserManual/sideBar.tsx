import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  IconButton,
} from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

const SidebarDocs: any = ({ isOpen, handleSidebarClose, resource, onSelect }) => {

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      onClose={handleSidebarClose}
      style={{ width: 300 }}
    >
      <div className="h-16 bg-primary flex items-center px-4">
        <h2>Equipt</h2>
      </div>
      <Divider />
      <div style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <List>
          {resource?.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem button onClick={() => toggleSection(index)}>
                <ListItemText primary={item?.sectionName} />
                <IconButton size="small">
                  {openSections[index] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </ListItem>
              <Collapse in={openSections[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item?.resource?.map((resource) => (
                    <ListItem
                      button
                      key={resource._id}
                      onClick={() => onSelect({
                        name: resource.resourceLabel,
                        sections: resource.sections,
                      })}
                    >
                      <ListItemText primary={resource.resourceLabel} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </div>
    </Drawer>
  );
};

export default SidebarDocs;
