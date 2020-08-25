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
  multipleStatements: 'true',
};
var pool = mysql.createPool(dbConfig);

router.get('/bidChild/:toyId', function (req, res, next) {
  var sess = req.session;
  var toyId = req.params.toyId;
  pool.getConnection(function (err, conn) {
    if (err) {
      throw err;
    }
    var sql =
      'select bid.* from bid where toy_toyId = ? order by bidCoin DESC ';
    conn.query(sql, [toyId], (err, row) => {
      if (err) {
        throw err;
      }
      res.render('index', {
        page: './sub/bidChild.ejs',
        data: row,
        sess: sess,
      });
    });
  });
});

router.post('/bid/:toyId', function (req, res, next) {
  var sess = req.session;
  var toyId = req.params.toyId;
  var coin = parseInt(sess.info.coin - req.body.bidCoin);
  pool.getConnection(function (err, conn) {
    if (err) {
      throw err;
    }
    var sql1 = 'select currentCoin, toy_user from toy where toyId = ?';
    conn.query(sql1, [toyId], (err, row1) => {
      if (err) {
        throw err;
      } else {
        if (row1[0].currentCoin < req.body.bidCoin) {
          if (row1[0].toy_user != sess.info.id) {
            if (coin >= 0) {
              var sql2 = 'update toy set currentCoin = ? where toyId = ?';
              conn.query(sql2, [req.body.bidCoin, toyId], (err, row2) => {
                if (err) {
                  throw err;
                }
                var sql3 = 'update user set coin = ? where id = ?';
                conn.query(sql3, [coin, sess.info.id], (err, row3) => {
                  if (err) {
                    throw err;
                  }
                  var sql4 =
                    'select user_id from bid where user_id = ? and toy_toyId = ?';
                  console.log(sess.info.id, toyId);
                  conn.query(sql4, [sess.info.id, toyId], (err, row4) => {
                    console.log(row4.length);
                    if (row4.length != 0) {
                      //재입찰
                      sql5 =
                        'update bid set bidCoin = ? , bidTime = now() where user_id = ? and toy_toyId = ?';
                      conn.query(
                        sql5,
                        [req.body.bidCoin, sess.info.id, toyId],
                        (err, row5) => {
                          if (err) {
                            throw err;
                          }
                          if (row5) {
                            var sql =
                              'select * From user where id = ? AND pw = ?';
                            conn.query(
                              sql,
                              [sess.info.id, sess.info.pw],
                              (err, row) => {
                                conn.release();
                                if (err) {
                                  throw err;
                                } else {
                                  sess.info = row[0];
                                  console.log(sess.info);
                                  res.send(
                                    "<script>alert('재입찰완료.'); history.back();</script>"
                                  );
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      //입찰
                      sql6 = 'insert into bid values (?,?,?,now())';
                      conn.query(
                        sql6,
                        [sess.info.id, toyId, req.body.bidCoin],
                        (err, row6) => {
                          if (err) {
                            throw err;
                          } else {
                            sql7 =
                              'update toy set bidNum = bidNum + 1 where toyId = ?';
                            conn.query(sql7, [toyId], (err, row7) => {
                              if (err) {
                                throw err;
                              }
                              if (row7) {
                                var sql =
                                  'select * From user where id = ? AND pw = ?';
                                conn.query(
                                  sql,
                                  [sess.info.id, sess.info.pw],
                                  (err, row) => {
                                    conn.release();
                                    if (err) {
                                      throw err;
                                    } else {
                                      sess.info = row[0];
                                      console.log(sess.info);
                                      res.send(
                                        "<script>alert('입찰 완료.'); history.back();</script>"
                                      );
                                    }
                                  }
                                );
                              }
                            });
                          }
                        }
                      );
                    }
                  });
                });
              });
            } else {
              res.writeHead(200, {
                'content-type': 'text/html; charset=utf-8',
              });
              res.write(
                "<script>alert('코인이부족해요.');history.back();</script>"
              );
            }
          } else {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
            res.write(
              "<script>alert('친구가 등록한 장난감이에요~!.');history.back();</script>"
            );
          }
        } else {
          res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          res.write(
            `<script>alert(${row1[0].currentCoin}+"보다 커야해요!");history.back();</script>`
          );
        }
      }
    });
  });
}); //입찰하기

function myTimer() {
  var d = new Date();
  var t = d.toFormat('YYYY-MM-DD HH24:MI:SS');
  console.log(t);
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql =
      "select toyId,bidNum from toy where endTime < ? and bidstate != '입찰완료'";
    conn.query(sql, [t], (err, toyId) => {
      if (err) {
        throw err;
      }
      if (toyId[0]) {
        for (var i = 0; i < toyId.length; i++) {
          if (toyId[0].bidNum != 0) {
            var sql_update1 =
              "update toy set bidState = '입찰완료', winner = (select user_id from bid where toy_toyID = ? ORDER BY bidCoin DESC LIMIT 1) where endTime < ? and toyId = ?";
            conn.query(
              sql_update1,
              [toyId[i].toyId, t, toyId[i].toyId],
              (err, update1) => {
                if (err) {
                  throw err;
                }
                conn.release();
              }
            );
          } else {
            var sql_update2 =
              "update toy set bidState = '유찰' where endTime < ? and toyId = ?";
            conn.query(sql_update2, [t, toyId[i].toyId], (err, update2) => {
              if (err) {
                throw err;
              }
              conn.release();
            });
          }
        }
      }
    });
  });
} //상태, 낙찰자 업데이트

var myVar = setInterval(myTimer, 60000); //1분마다 실행

module.exports = router;
