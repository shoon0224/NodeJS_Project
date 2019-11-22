var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var date = require('date-utils');
var newDate = new Date();
var time = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');

var dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'shoon0224',
  port: 3306,
  database: 'atoy',
  use_prepared_statements: 'N'
};
var pool = mysql.createPool(dbConfig);

router.get('/bidChild/:toyId',function(req,res,next){
  var sess=req.session;
  var toyId = req.params.toyId;
  pool.getConnection(function(err,conn){
    if(err){
      throw err;
    }
    var sql = "select bid.* from bid where toy_toyId = ? order by bidCoin DESC ";
    conn.query(sql,[toyId],(err,row)=>{
      if(err){
        throw err;
      }
      res.render('index', { page: './sub/bidChild.ejs', data: row, sess: sess });
    })
  })
})
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

  function myTimer(){
    var d = new Date();
    var t = d.toFormat('YYYY-MM-DD HH24:MI:SS');
    console.log(t);
    pool.getConnection((err,conn)=>{
      if(err){
        throw err;
      }
      var sql="select toyId from toy where endTime < '2019-11-21 21:14' and bidstate != '입찰완료'";
      conn.query(sql,[t],(err,toyId)=>{
        if(err){
          throw err;
        }
        if(toyId[0]){
          for(var i = 0; i<toyId.length; i++){
            var sql_update = "update toy set bidState = '입찰완료', winner = (select user_id from bid where toy_toyID = ? ORDER BY bidCoin ASC LIMIT 1) where endTime < ?";
            conn.release();
            conn.query(sql_update, [toyId[i], t], (err, update) => {
              if(err){
                throw err;
              }
            });
          }
        }
      });
    });
  }//상태, 낙찰자 업데이트
  
  var myVar=setInterval(function(){myTimer();},100000); //1초마다 실행
module.exports = router;
