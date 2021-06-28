var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student_matching_system'
});

conn.connect();

//------------post 영역

//로그인
router.post('/login', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "select * from user where ID = ? AND PW = ?";
  conn.query(sql, [body.id, body.pw], function (err, row) {

    if (err) {
      console.log(err);
    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('잘못입력했습니다.'); history.back(); </script>");
      }
      else {
        sess.userID = row[0].ID
        sess.userName = row[0].name
        res.redirect("/");
      }
    }
  });
});


//회원가입
router.post('/signup', function (req, res, next) {
  var body = req.body
  var sql = "insert into user (ID,grade,PW,major,student_no,name,phone_no,nationality_division) values (?,?,?,?,?,?,?,1)"
  conn.query(sql, [body.id, body.grade, body.pw, body.major, body.student_no, body.name, body.phone_no], function (err, row) {
    if (err) {
      console.log(err);
      console.log("회원가입에러", body.id, body.grade, body.pw, body.major, body.student_no, body.name, body.phone_no);
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('아이디가 중복되었습니다..'); history.back(); </script>");
    }
    else {
      res.redirect("/login");
    }
  });
});

//팀매칭신청
router.post('/apply_matching', function (req, res, next) {
  console.log(req.body.select_time);
  
  var body = req.body
  var sess = req.session
  var name
  var theEnd = false;
  var CtheEnd = false;

  var sql1 = "insert into apply_matching (ID,use_available_language_name,wnat_language_name) values (?,?,?)" //팀 매칭 신청
  var sql2 = "select LAST_INSERT_ID() as code" //팀 매칭 신청 번호
  var sql3 = "insert into apply_time (apply_code,time_code) values (?,?)" // 팀 매칭 신청 시간
  var sql4 = "select * from apply_matching where use_available_language_name = ? and wnat_language_name = ? and apply_code!=?" // 배우고싶은언어 원하는언어 교차인 사람
  var sql5 = "select * from apply_time where apply_code=? and apply_code!=?" // 선택한 시간
  var sql6 = "select * from lecture_room_class where team_code is null and time_code=?"
  var sql7 = "update lecture_room_class set team_code = ?"
 

  if (body.select_time == undefined || body.select_time.length < 4) {
    res.send('<script>alert("시간표를 4개이상 선택하세요");history.back();</script>')
  } else if (body.available_language == body.wnat_language) {
    res.send('<script>alert("다른언어를 선택하세요");history.back();</script>')
  } else {
    conn.query(sql1, [sess.userID, body.available_language, body.wnat_language], function (err, row1) {
      conn.query(sql2, function (err, row2) {
        var code = row2[0].code
        body.select_time.forEach(st => {
          conn.query(sql3, [code, st * 1], function (err, row3) {

          });
        })
        conn.query(sql4, [body.wnat_language, body.available_language, code], function (err, row4) {
          console.log('row4:', row4)
          row4.some(function (r4) {
            if (theEnd) {
              return true;
            }
            conn.query(sql5, [r4.apply_code, code], function (err, row5) {
              console.log("row5:", row5);
              var count = 0;
              row5.some(function (r5) {
                if (theEnd) {
                  return true;
                }
                console.log("그사람의 선택 시간은?", r5.time_code)
                body.select_time.some(st2 => {
                  if ((st2 * 1) == r5.time_code) {
                    count = count + 1;
                    if (count >= 4) {
                      theEnd = true;
                      name = r4.ID
                      console.log("나와 매칭될 사람은 바로 이사람!!", name);
      
                      return true;
                    }
                  }
                })
              })
            });
          })
          //----------------------------------------------------------------------------------------
          res.redirect("/");
        });
      });
    });
  }
});

//------------get 영역

//메인페이지
router.get('/', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "select * from user where id = ? ";
  conn.query(sql, [sess.userID], function (err, row) {
    res.render('./main/index', { page: '../main/index_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: row[0] });
  });
});

//로그인페이지
router.get('/login', function (req, res, next) {
  res.render('./login/login', { page: '../login/login_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템' });
});

//회원가입
router.get('/signup', function (req, res, next) {
  res.render('./signup/signup', { page: '../signup/signup_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템' });
});

//팀매칭신청
router.get('/apply_matching', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql1 = "select * from user where id = ? ";
  var sql2 = "select * from language";
  var sql3 = "SELECT DISTINCT time_code FROM lecture_room_class"
  conn.query(sql1, [sess.userID], function (err, row1) {
    conn.query(sql2, [sess.userID], function (err, row2) {
      conn.query(sql3, [sess.userID], function (err, row3) {
        console.log('강의실 시간?',row3)
        res.render('./apply_matching/apply_matching', { page: '../apply_matching/apply_matching_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: row1[0], language: row2, ct:row3 });
      });
    });
  });
});

module.exports = router;
