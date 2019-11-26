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
  use_prepared_statements: 'N',
  multipleStatements: 'true'
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
});

router.post('/bid/:toyId', function(req, res, next){
  var sess = req.session;
  var toyId = req.params.toyId;
  var coin = sess.info.coin - req.body.bidCoin;

  pool.getConnection(function(err, conn){
    if(err){
      throw err;
    }
    else{
      var sql = "select user_id from bid where user_id = ? and toy_toyId = ?";
      conn.query(sql, [sess.info.id, toyId],(err, row) =>{
        if(err){
          throw err;
        }
        if(row[0]){ //입찰 있으면 현재코인 업데이트, 비드넘버
            var sql_toy = "update toy set currentCoin = ? where toyId = ? and currentCoin < ? and toy_user != ?" + "update user set coin = ? where id = ?;";
            conn.query(sql_toy, [req.body.bidCoin, toyId, req.body.bidCoin, sess.info.id, coin, sess.info.id], (err, toy) => {
              conn.release();
              if(err){
                throw err;
              }
              else{
                res.send("<script>alert('재입찰 완료.'); history.back();</script>");
              }
            });
        }
        else{ //입찰 없으면
          console.log(coin);
          var sql_toy_no = "update toy set currentCoin = ?, bidNum = (select bidNum + 1 from toy where toyId = ?) where toyId = ? and currentCoin < ? and toy_user != ?;" + "update user set coin = ? where id = ?;";
          conn.query(sql_toy_no, [req.body.bidCoin, toyId, toyId, req.body.bidCoin, sess.info.id, coin, sess.info.id], (err, toy) => {
            conn.release();
            if(err){
              throw err;
            }
            else{
              res.send("<script>alert('입찰 완료.'); history.back();</script>");
            }
          });
        }
      });
    }
  });
}); //입찰하기

  function myTimer(){
    var d = new Date();
    var t = d.toFormat('YYYY-MM-DD HH24:MI:SS');
    // console.log(t);
    pool.getConnection((err,conn)=>{
      if(err){
        throw err;
      }
      var sql="select toyId from toy where endTime < ? and bidstate != '입찰완료'";
      conn.query(sql,[t],(err,toyId)=>{
        if(err){
          throw err;
        }
        if(toyId[0]){
          for(var i = 0; i<toyId.length; i++){
            var sql_update = "update toy set bidState = '입찰완료', winner = (select user_id from bid where toy_toyID = ? ORDER BY bidCoin ASC LIMIT 1) where endTime < ? and toyId = ?";
            conn.query(sql_update, [toyId[i], t, toyId[i]], (err, update) => {
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