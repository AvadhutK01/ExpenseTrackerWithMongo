const bodyParser = require('body-parser');
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const router = require('./Routers/routes');
const path = require('path');
const userRoute = require('./Routers/userRoute');
const expenseRoutes = require('./Routers/expenseRoutes');
const payRoute = require('./Routers/paymentRoutes');
const fs = require('fs');
const compression = require('compression');
const morgan = require('morgan');
const { default: mongoose } = require('mongoose');
const app = express();
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }))
app.use(express.static(path.join(__dirname, '..', 'Frontend', 'public')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
app.use("/user", userRoute);
app.use('/expense', expenseRoutes)
app.use('/payment', payRoute);
app.use(router);
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.DB_URL).then(() => {
    console.log("Connected");
    app.listen(PORT);
}).catch((err) => {
    console.log(err);
});
