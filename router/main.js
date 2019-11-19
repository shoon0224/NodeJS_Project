var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');

var _storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: _storage });


var dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'shoon0224',
    port: 3306,
    database: 'atoy',
    use_prepared_statements: 'N'
  };
var pool = mysql.createPool(dbConfig);

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

  router.get('/bidRegist', function (req, res, next) {
   var sess = req.session;
    res.render('index', { page: './sub/bidRegist', sess: sess });
  });//경매등록 페이지 요청

  router.get('/', function (req, res, next) {
    var sess = req.session;
    pool.getConnection((err,conn)=>{
      if(err){
        throw err;
      }
      var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum from toy"
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
      var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum from toy order by endTime ASC"
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
      var sql="select toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum from toy order by bidNum DESC"
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
      var sql = "select  toyId,toyPic,toyName,currentCoin,date_format(endTime,'%y-%m-%d %T') AS endTime,bidNum from toy where toyName like concat('%', ?, '%') "
      conn.query(sql, [req.body.inquire], function (err, row) {
        if (err) {
          throw err;
        }
        res.render('index', { page: './sub/main.ejs', data: row, sess: sess })
      })
    })
  })

  
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
  
  router.post('/bidRegist',upload.single('photo'),function(req,res,next){
    var sess = req.session;
    var imgurl = 'images/'+req.file.originalname;
    pool.getConnection(function(err,conn){
      if(err){
        throw err;
      }
      var sql="insert into toy values (null,?,?,?,?,?,?,0,?,0,?)";
      conn.query(sql,[sess.info.id,req.body.toyName,req.body.toyRprice,req.body.saleReason,req.body.toyExp,req.body.startCoin,imgurl,req.body.endTime], function(err,row){
        conn.release();
        if(err){
          throw err;
        }
        if(row){
          sess.info=row[0];
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
            res.write("<script>alert('장난감이 등록되었습니다.');location.href='/';</script>")
        }else{
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('장난감 등록이 완료되지 않았습니다.');history.back();</script>")
        }
      })
    })
  });//경매등록하기

  router.get('/modify/:toyId',function(req,res,next){
    var sess = req.session;
    var toyId = req.params.toyId;
    pool.getConnection(function(err,conn){
      if(err){
        throw err;
      }
      var sql="select *,date_format(endTime,'%y-%m-%d %T') AS endTime from toy where toyId=?";
      conn.query(sql, [toyId], function (err, result) {
        conn.release();
        if (err) {
          throw err;
        }
        res.render('index', { page: './sub/bidModify.ejs', data: result, sess: sess });
      });
    })
  })

  router.post('/modify/:toyId',upload.single('photo'),function(req,res,next){
    var toyId = req.params.toyId;
    var imgurl = 'images/'+req.file.originalname;
    pool.getConnection(function(err,conn){
      if(err){
        throw err;
      }
      var sql= "update toy set toyName=? toyRprice=? saleReason=? toyExp=? startCoin=? endTime=? toyPic=? where toyId=?";
      conn.query(sql,[req.body.toyName, req.body.toyRprice, req.body.saleReason, req.body.toyExp, reql.body.startCoin, req.body.endTime, imgurl, toyId],function(err,result){
        conn.release();
        if(err){
          throw err;  
        }
        if(result){
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('정보가 수정되었습니다.');location.href='/';</script>")
        }
        else{
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('정보 수정이 완료되지 않았습니다.');history.back();</script>")
        }
      })
    })
  })//경매수정하기

  router.get('/delete/:toyId', function (req, res, next) {
    var toyId = req.params.toyId;
    pool.getConnection((err, conn) => {
      if (err) {
        throw err;
      }
      console.log("DB Connection");
      var sql = "delete from toy where toyId = ?";
      conn.query(sql, [toyId], function (err, result) {
        conn.release();
        if (err) {
          throw err;
        }
        if (result) {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('삭제가 완료되었습니다.');location.href='/';</script>")
        }
        else {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.write("<script>alert('삭제가 되지 않았습니다.');history.back();</script>")
        }
      });
    })
  });
  router.get("/detail/:toyId",function(req,res,next){
    var sess = req.session;
  var toyId = req.params.toyId;
  pool.getConnection((err, conn) => {
    if (err) {
      throw err;
    }
    console.log("DB Connection");
    var sql = "select toyId,toyName,toyPic,currentCoin,saleReason,bidNum,toyExp,date_format(endTime,'%y-%m-%d %T') AS endTime from toy where toyId = ?"
    conn.query(sql, [toyId], function (err, row) {
      conn.release();
      if (err) {
        throw err;
      }
      res.render('index', { page: './sub/detail.ejs', data: row, sess: sess });
    });
  })
  })


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
        else {
          res.send("<script>alert('충전완료.');history.back();</script>");
        }
      });
    });
  });//코인충전 요청

  router.get('/mypage',function(req,res,next){
    var sess=req.session;
    pool.getConnection(function(err,conn){
      if(err){
        throw err;
      }
      var sql="select toyId,toyPic,toyName,currentCoin,bidNum from toy where toy_user=? ";
      conn.query(sql,[sess.info.id],(err,row)=>{
        if(err){
          throw err;
        }
        res.render('index', { page: './sub/mypage.ejs', data: row, sess: sess })
      })
    })
  })//마이페이지 불러오기


  module.exports = router;