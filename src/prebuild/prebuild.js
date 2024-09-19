const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const apiUrl = `${process.env.VITE_APP_API_URL}/portal-version/latest` || 'https://master.portal.equip-t.com/api/portal-version/latest';

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    if (data?.data && data?.data?.version) {
      fs.writeFileSync('src/prebuild/prebuildData.json', JSON.stringify(data.data));
    }
  })
  .catch((error) => console.error('Error fetching data:', error));
