const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

// change this env variable
const apiUrl = process.env.VITE_APP_VERSION_URL || '';

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    fs.writeFileSync('src/prebuild/prebuild.json', JSON.stringify(data));
  })
  .catch((error) => console.error('Error fetching data:', error));
