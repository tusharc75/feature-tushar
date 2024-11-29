import React, { useContext, useEffect, useState } from 'react';
import { Box, Toolbar } from '@material-ui/core';
import { motion } from 'framer-motion';
import HeaderDocs from './Header';
import SideBar from './sideBar';
import Content from './Content';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq } from 'lodash';

const LayoutDocs = () => {

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [resource, setResource] = useState(null);

  const [selectedResource, setSelectedResource] = useState({
    name: 'Welcome to the Equipt Portal',
    sections: [],
  });

  const toastConfig = useContext(CustomToastContext);


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axiosInstance().get('/user/user-manual').then(({ data: { data } }) => {
      const sectionNames = uniq(data?.resources?.map((e) => e?.sectionName))
      const result = []
      sectionNames?.forEach((ele) => {
        const obj: any = {};
        obj.sectionName = ele
        obj.resource = data?.resources?.filter((e) => e.sectionName === ele)
        result.push(obj)
      })
      setResource(result)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    })
  };


  return (
    <Box display="flex" height="100vh" overflow="hidden">
      <SideBar
        isOpen={isSidebarOpen}
        resource={resource}
        handleSidebarClose={handleSidebarToggle}
        onSelect={(content) => setSelectedResource(content)}
      />
      <Box component="main" className="flex-grow">
        <HeaderDocs onToggleSidebar={handleSidebarToggle} />
        <Toolbar />
        <motion.div className="p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}   >
          <Content content={selectedResource} />
        </motion.div>
      </Box>
    </Box>
  );
};

export default LayoutDocs;
