const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const apiUrl = `${import.meta.env?.VITE_APP_API_URL}/portal-version/auto-update-new-version`;

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({}),
})
  .then((response) => response.json())
  .then((data) => {
    if (data?.data && data?.data?.version) {
      fs.writeFileSync('src/prebuild/prebuildData.json', JSON.stringify(data.data));
    }
  })
  .catch((error) => console.error('Error fetching data:', error));
