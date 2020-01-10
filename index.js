const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// set up port
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload({
    createParentPath: true
}));
app.use(cors());

// add routes
const router = require('./routes/router_users');
app.use('/users', router);

// run server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));