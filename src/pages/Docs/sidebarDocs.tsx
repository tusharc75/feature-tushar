import React, { useEffect, useState } from 'react';
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
import axiosInstance from 'src/axios/axiosInstance';

interface SidebarProps {
  isOpen: boolean;
  handleSidebarClose: () => void;
  onSelect: (content: { name: string; sections: any[] }) => void; // Pass both name and sections
}

const SidebarDocs: React.FC<SidebarProps> = ({ isOpen, handleSidebarClose, onSelect }) => {
  const [sections, setSections] = useState<Record<string, { name: string; id: string }[]>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axiosInstance().get('/user-manual-master/docs');
        const resources = response.data.data.resources;

        const groupedSections: Record<string, { name: string; id: string }[]> = resources.reduce((acc, resource) => {
          console.log(resource);
          const { sectionName, name, resourceId } = resource;
          if (sectionName) {
            acc[sectionName] = acc[sectionName] || [];
            acc[sectionName].push({ name: name , id: resourceId }); // Store both name and id
          }
          return acc;
        }, {});

        setSections(groupedSections);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchSections();
    }
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleResourceClick = async (resourceId: string) => {
    try {
      resourceId = "6747018effa3f7a3f4ad7269";
      const response = await axiosInstance().get(`/user-manual-master/${resourceId}`);
      const content = response.data;
      console.log(content);
      // onSelect({
      //   name: content.resource,  // Resource name like 'Lead'
      //   sections: content.sections,  // Sections of the resource
      // });
    } catch (error) {
      console.error('Error fetching resource content:', error);
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={isOpen}
      onClose={handleSidebarClose}
      style={{ width: 240 }}
    >
      <div className="h-16 bg-primary flex items-center px-4">
        <h2>Equipt</h2>
      </div>
      <Divider />
      <div style={{ maxHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
        <List>
          {Object.keys(sections).map((section) => (
            <React.Fragment key={section}>
              <ListItem button onClick={() => toggleSection(section)}>
                <ListItemText primary={section} />
                <IconButton size="small">
                  {openSections[section] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </ListItem>
              <Collapse in={openSections[section]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {sections[section].map((resource) => (
                    <ListItem
                      button
                      key={resource.id} // Use the resource ID here
                      style={{ paddingLeft: 32 }}
                      onClick={() => handleResourceClick(resource.id)} // Pass resource ID
                    >
                      <ListItemText primary={resource.name} />
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
