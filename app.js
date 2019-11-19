var express = require('express');
var path = require('path');
var logger = require('morgan');
var cors = require("cors");
var session = require('express-session');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
  secret:'@#@$MYSIGN#@$#$',
  resave: false,
  saveUninitialized: true
}));

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./router/main');
app.use('/', indexRouter);

var server = app.listen(5000, function(){
    console.log("Express server has started on port 5000")
});

module.exports = app;