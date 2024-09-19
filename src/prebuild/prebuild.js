const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

// const apiUrl = 'http://localhost:4000/version';
const apiUrl = process.env.VITE_APP_VERSION_URL;

console.log(apiUrl);

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    fs.writeFileSync('src/prebuild/prebuild.json', JSON.stringify(data));
  })
  .catch((error) => console.error('Error fetching data:', error));
