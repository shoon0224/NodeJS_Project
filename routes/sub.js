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

router.post('/tel/:toyId',function(req,res,next){
    var sess=req.session;
    var toyId = req.params.toyId;
    pool.getConnection(function(err,conn){
      if(err){
        throw err;
      }
      var sql="select user.tel from user,toy where user.id=toy.toy_user and toyId=?";
      conn.query(sql,[toyId],(err,row)=>{
        conn.release();
        if(err){
          throw err;
        }
        console.log(row);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.write(`<script>alert(${row[0].tel});history.back();</script>`)
      })
    })    
  });

module.exports = router;