var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var date = require('date-utils');
var newDate = new Date();
var time = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');

var dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  port: 3306,
  database: 'atoy',
  use_prepared_statements: 'N'
};
var pool = mysql.createPool(dbConfig);

router.post('/bid/:toyId', function(req, res, next){
    var sess = req.session;
    var toyId = req.params.toyId;
    pool.getConnection(function(err, conn){
      if(err){
        throw err;
      }
      var sql = "select user_id from bid where user_id = ? and toy_toyId = ?";
      conn.query(sql,[sess.info.id, toyId], (err,row) => {
        if(err){
          throw err;
        }
        if(row[0]){
          var sql_toy = "select currentCoin, bidNum from toy where toyId = ?";
          conn.query(sql_toy,[toyId], (err, row) => {
            conn.release();
            if(err){
              throw err;
            }
            if(row[0]){
              console.log(row[0].currentCoin, row[0].bidNum);
              var currentCoin = row[0].currentCoin;
              var sql_update_toy = "update toy set currentCoin = ? where toyId = ?";

              console.log("현재 코인 : " + currentCoin);
              console.log("입찰 코인 : " + req.body.bidCoin);
              conn.query(sql_update_toy,[req.body.bidCoin, toyId], (err, result) => {
                if(err){
                  throw err;
                }
                else{
                  if(currentCoin < req.body.bidCoin){
                    var sql_update_bid = "update bid set bidCoin = ?, bidTime = ? where user_id = ? and toy_toyId = ?";
                    conn.query(sql_update_bid, [req.body.bidCoin, time, sess.info.id, toyId]);
                    if(err){
                      throw err;
                    }
                    else{
                      res.send("<script>alert('재입찰 완료.'); history.back();</script>");
                    }
                  }
                  else{
                      res.send("<script>alert('실패.'); history.back();</script>");
                  }
                }
              });
            }
          });
        }
        else{
          var sql_toy = "select currentCoin, bidNum from toy where toyId = ?";
          conn.query(sql_toy,[toyId], (err, row) => {
            conn.release();
            if(err){
              throw err;
            }
            if(row[0]){
              console.log(row[0].currentCoin, row[0].bidNum);
              var currentCoin = row[0].currentCoin, bidNum = row[0].bidNum + 1;
              var sql_update_toy = "update toy set currentCoin = ?, bidNum = ? where toyId = ?";
              console.log(currentCoin, bidNum, toyId);
              conn.query(sql_update_toy,[req.body.bidCoin, bidNum, toyId], (err, result) => {
                console.log("현재 코인 : " + currentCoin);
                console.log("입찰 코인 : " + req.body.bidCoin);
                if(err){
                  throw err;
                }
                else{
                  if(currentCoin < req.body.bidCoin){
                    var sql_update_bid = "insert into bid (user_id, toy_toyId, bidCoin, bidTime) values (?, ?, ?, ?)";
                    conn.query(sql_update_bid, [sess.info.id, toyId, req.body.bidCoin, time]);
                    if(err){
                      throw err;
                    }
                    else{
                      res.send("<script>alert('입찰 완료.'); history.back();</script>");
                    }
                  }
                  else{
                    res.send("<script>alert('실패.'); history.back();</script>");
                  }
                }
              });
            }
          });
        }
      });
    });
  }); //입찰하기
module.exports = router;
