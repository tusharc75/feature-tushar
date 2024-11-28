import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@material-ui/core';

interface Section {
  id: string;
  title: string;
  content: string; // HTML content
}

interface ContentProps {
  content: {
    name: string;
    sections: Section[];
  };
}

const Content: React.FC<ContentProps> = ({ content }) => {

  const handleScrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box display="flex" flexDirection="row">
      {/* Main Content Area */}
      <Box flex={3} mr={4}>
        <Typography variant="h4" gutterBottom>
          {content.name}
        </Typography>
        {content.sections.map((section) => (
          <Box key={section.id} id={section.id} my={4}>
            <Typography variant="h5" gutterBottom>
              {section.title}
            </Typography>
            <Box dangerouslySetInnerHTML={{ __html: section.content }} />
          </Box>
        ))}
      </Box>

      {/* Navigation Area */}
      <Box flex={1} maxHeight="100vh" overflow="auto" position="sticky" top={0}>
        <Typography variant="h6" gutterBottom>
          Navigate
        </Typography>
        <List>
          {content.sections.map((section) => (
            <ListItem button key={section.id} onClick={() => handleScrollToSection(section.id)}>
              <ListItemText primary={section.title} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );
};

export default Content;
