var express = require('express');
var router = express.Router();
var mysql = require('mysql');

var dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'shoon0224',
  port: 3306,
  database: 'atoy',
  use_prepared_statements: 'N'
};
var pool = mysql.createPool(dbConfig);

router.get('/', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum,bidState from toy"
    conn.query(sql,(err,row)=>{
      conn.release();
      if(err){
        throw err;
      }
      console.log(row);
      res.render('index', { page: './sub/main.ejs', data: row, sess: sess });
    })
  })
});//메인화면요청

router.get('/deadLine', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum,bidState from toy order by endTime ASC"
    conn.query(sql,(err,row)=>{
      conn.release();
      if(err){
        throw err;
      }
      console.log(row);
      res.render('index', { page: './sub/main.ejs', data: row, sess: sess });
    })
  })
});//마감임박순정렬

router.get('/popular', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err,conn)=>{
    if(err){
      throw err;
    }
    var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum,bidState from toy order by bidNum DESC"
    conn.query(sql,(err,row)=>{
      conn.release();
      if(err){
        throw err;
      }
      console.log(row);
      res.render('index', { page: './sub/main.ejs', data: row, sess: sess });
    })
  })
});//인기순정렬

router.post('/inquire', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    conn.release();
    if (err) {
      throw err;
    } ''
    var sql = "select  toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum,bidState from toy where toyName like concat('%', ?, '%') "
    conn.query(sql, [req.body.inquire], function (err, row) {
      if (err) {
        throw err;
      }
      res.render('index', { page: './sub/main.ejs', data: row, sess: sess })
    })
  })
})

module.exports = router;