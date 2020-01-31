const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '.')));
app.listen(port, function() {
    console.log("Server started at port: " + port);
})