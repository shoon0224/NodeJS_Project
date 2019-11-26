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

/* GET users listing. */
router.get('/login', function (req, res, next) {
  var sess = req.session;
  res.render('index', { page: './login', sess: sess });
});//로그인 페이지 요청

router.get('/join', function (req, res, next) {
  var sess = req.session;
  res.render('index', { page: './join', sess: sess });
});//회원가입 페이지 요청

router.get('/coin', function (req, res, next) {
  var sess = req.session;
  res.render('index', { page: './sub/coin', sess: sess });
});//코인충전 페이지 요청

router.post('/login', function (req, res, next) {
  var sess = req.session;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    var sql = "select * From user where id = ? AND pw = ?";
    conn.query(sql, [req.body.id, req.body.pw], (err, row) => {
      conn.release();
      if (err) {
        res.send(300, {
          result: 0,
          msg: 'DB Error'
        });
      }
      if (row.length === 0) {
        res.send(`<script> alert('로그인에 실패하였습니다.');  history.back(); </script>`);
      }
      else {
        sess.info = row[0];
        res.redirect('/');
      }
    });
  })
});//로그인 요청

router.post('/logout', function (req, res, next) {
  var sess = req.session;
  sess.destroy();
  res.redirect('/');
});//로그아웃 요청

router.post('/join', function (req, res, next) {
  var sess = req.session;
  pool.getConnection(function (err, conn) {
    if (err) {
      throw err;
    }
    var sql = "select * from user where id = ?";
    conn.query(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      if (row.length === 0) {
        var sql = "insert into user values (?, ?, ?, ?, ?, ?,0)";
        conn.query(sql, [req.body.id, req.body.pw, req.body.name, req.body.address, req.body.tel, req.body.parentsPw], function (err, row) {
          conn.release();
          if (err) {
            throw err;
          }
          res.render("index", { page: './login', sess: sess });
        });
      }
      else {
        res.send("<script>alert('중복된 아이디입니다.');history.back();</script>");
      }
    });//회원가입 요청
  })
});
router.post('/coin', function (req, res, next) {
  var sess = req.session;
  pool.getConnection(function (err, conn) {
    if (err) {
      throw err;
    }
    var sql = "update user set coin = ? where id = ? and parentsPw = ?";
    var coin = parseInt(req.body.coin) + parseInt(sess.info.coin);
    conn.query(sql, [coin, sess.info.id, req.body.parentsPw], (err, row) => {
      if (err) {
        throw err;
      }
      if(row.affectedRows==1){
        console.log(row)
        var sql = "select * From user where id=?";
        conn.query(sql, [sess.info.id], (err, row) => {
          if (err) {
            throw err;
          }
          if(row){
            sess.info = row[0];
            res.send("<script>alert('충전완료.');history.back();</script>");
          }
        })
      }
    else{
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.write("<script>alert('비밀번호가 틀렸습니다.');history.back();</script>")
    }
  });
})
});//코인충전 요청

router.get('/mypage',function(req,res,next){
  var sess=req.session;
  pool.getConnection(function(err,conn){
    if(err){
      throw err;
    }
    var sql="select toyId,toyPic,toyName,currentCoin,bidNum,bidState from toy where toy_user=? ";
    conn.query(sql,[sess.info.id],(err,row)=>{
      console.log(row);
      if(err){
        throw err;
      }
      if(row){
        var sql="select toy.*,bid.* from toy,bid where toy.toyId=bid.toy_toyId and bid.user_id=?";
        conn.query(sql,[sess.info.id],(err,result)=>{
          console.log(result);
          conn.release();
          if(err){
            throw err;
          }
          res.render('index', { page: './sub/mypage.ejs', data: row, data2: result, sess: sess })
        })
      }
    })
  })
})//마이페이지 불러오기

module.exports = router;