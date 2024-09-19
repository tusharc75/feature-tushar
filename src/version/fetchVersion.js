const fs = require('fs');
const fetch = require('node-fetch');

const apiUrl = 'http://localhost:4000/version';

fetch(apiUrl)
  .then((response) => response.json())
  .then((data) => {
    fs.writeFileSync('src/version/version.json', JSON.stringify(data));
  })
  .catch((error) => console.error('Error fetching data:', error));
