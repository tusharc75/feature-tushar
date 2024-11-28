import React, { useState } from 'react';
import { Box, Toolbar } from '@material-ui/core';
import { motion } from 'framer-motion';
import HeaderDocs from './Header';
import SidebarDocs from './sidebarDocs';
import Content from './Content';

const LayoutDocs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedContent, setSelectedContent] = useState({
    name: 'Welcome to the Equipt Portal',
    sections: [],
  });

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box display="flex" height="100vh" overflow="hidden">
      <SidebarDocs
        isOpen={isSidebarOpen}
        handleSidebarClose={handleSidebarToggle}
        onSelect={(content) => setSelectedContent(content)}
      />
      <Box component="main" className="flex-grow">
        <HeaderDocs onToggleSidebar={handleSidebarToggle} />
        <Toolbar />
        <motion.div
          className="p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Content content={selectedContent} />
        </motion.div>
      </Box>
    </Box>
  );
};

export default LayoutDocs;
