var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');

var dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'shoon0224',
    port: 3306,
    database: 'atoy',
    use_prepared_statements: 'N'
};

var _storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: _storage });
var pool = mysql.createPool(dbConfig);

router.get('/bidRegist', function (req, res, next) {
    var sess = req.session;
    res.render('index', { page: './sub/bidRegist', sess: sess });
});//경매등록 페이지 요청

router.post('/bidRegist', upload.single('photo'), function (req, res, next) {
    var sess = req.session;
    var imgurl = 'images/' + req.file.originalname;
    pool.getConnection(function (err, conn) {
        if (err) {
            throw err;
        }
        var sql = "insert into toy values (null,?,?,?,?,?,0,?,0,?,'입찰중',null)";
        conn.query(sql, [sess.info.id, req.body.toyName, req.body.toyRprice, req.body.saleReason, req.body.toyExp, imgurl, req.body.endTime], function (err, row) {
            conn.release();
            if (err) {
                throw err;
            }
            if (row) {
                sess.info = row[0];
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                res.write("<script>alert('장난감이 등록되었습니다.');location.href='/';</script>")
            } else {
                res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                res.write("<script>alert('장난감 등록이 완료되지 않았습니다.');history.back();</script>")
            }
        })
    })
});//경매등록하기

router.get('/modify/:toyId', function (req, res, next) {
    var sess = req.session;
    var toyId = req.params.toyId;
    pool.getConnection(function (err, conn) {
        if (err) {
            throw err;
        }
        var sql = "select *,date_format(endTime,'%y-%m-%d %T') AS endTime from toy where toyId=?";
        conn.query(sql, [toyId], function (err, result) {
            conn.release();
            if (err) {
                throw err;
            }
            res.render('index', { page: './sub/bidModify.ejs', data: result, sess: sess });
        });
    })
})

router.post('/modify/:toyId', upload.single('photo'), function (req, res, next) {
    var toyId = req.params.toyId;
    pool.getConnection(function (err, conn) {
        if (err) {
            throw err;
        }
        if (req.file != null) {
            console.log("img");
            var imgurl = 'images/' + req.file.originalname;
            var sql = "update toy set toyName=?, toyRprice=?, saleReason=?, toyExp=?, toyPic=? where toyId=?";
            var toyRprice = parseInt(req.body.toyRprice)
            conn.query(sql, [req.body.toyName, toyRprice, req.body.saleReason, req.body.toyExp,imgurl, toyId], function (err, result) {
                conn.release();
                if (err) {
                    throw err;
                }
                if (result) {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('정보가 수정되었습니다.');location.href='/';</script>")
                }
                else {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('정보 수정이 완료되지 않았습니다.');history.back();</script>")
                }
            })
        }
        else {
            console.log("img");
            var sql = "update toy set toyName=?, toyRprice=?, saleReason=?, toyExp=? where toyId=?";
            var toyRprice = parseInt(req.body.toyRprice)
            conn.query(sql, [req.body.toyName, toyRprice, req.body.saleReason, req.body.toyExp, toyId], function (err, result) {
                conn.release();
                if (err) {
                    throw err;
                }
                if (result) {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('정보가 수정되었습니다.');location.href='/';</script>")
                }
                else {
                    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                    res.write("<script>alert('정보 수정이 완료되지 않았습니다.');history.back();</script>")
                }
            })

        }
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
});//경매삭제하기

router.get("/detail/:toyId", function (req, res, next) {
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
})//경매상세보기


module.exports = router;