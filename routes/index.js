var express = require('express');
var router = express.Router();
var moment = require('moment');


var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'student_matching_system'
});

conn.connect();
moment().format();

console.log(moment('20191215', "YYYYMMDD").week());


//------------post 영역 사용자

//활동일지 업데이트
router.post('/activityLogUpdate', function (req, res, next) {
  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

  var activityLog_code = req.body.activityLog_code;
  var sess = req.session
  var sql = "update activitylog set activityLog_contents = ? where activityLog_code = ?"
  conn.query(sql, [req.body.contents, req.body.activityLog_code], function (err, row) {
    if (err) {
      console.log(err);
    }
    res.redirect(`/mypage/matching/activityLog/detail/${activityLog_code}`);

  });
});

//팀매칭신청
router.post('/apply_matching', function (req, res, next) {
  console.log(req.body.select_time);

  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();


  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }
  var date = yyyy.toString() + mm.toString() + dd.toString();
  var week = moment(date, "YYYYMMDD").week();

  var body = req.body
  var sess = req.session
  var stArr = []
  var name
  var theEnd = false;

  var sql1 = "insert into apply_matching (ID,use_available_language_name,wnat_language_name) values (?,?,?)" //팀 매칭 신청 넣기
  var sql2 = "select LAST_INSERT_ID() as code" // row2 (팀 매칭 신청 번호) + row7(팀 번호)
  var sql3 = "insert into apply_time (apply_code,time_code) values (?,?)" // 팀 매칭 신청 시간 넣기
  var sql4 = "select * from user,apply_matching where use_available_language_name = ? and wnat_language_name = ? and apply_code!=? and user.ID=apply_matching.ID order by grade" // 배우고싶은언어 원하는언어 교차인 사람
  var sql5 = "select * from apply_time where apply_code=? and apply_code!=?" // 선택한 시간
  var sql6 = "INSERT INTO `team` (`team_code`, `team_keep_dismantle_yes_no`, `team_keep_dismantle_date`, `team_matched_date`,`team_matched_week`) VALUES (NULL, 'n', NULL, ?,?)" //팀 생성
  var sql8 = "insert into team_member (ID,team_code, matched_language) values (?,?,?)" // 팀 맴버 넣기 row8 + row9
  var sql10 = "select * from lecture_room_class where time_code = ? and team_code is null" // 강의실에 팀 배정하기위해 강의실 번호 알아내기
  var sql12 = "update lecture_room_class set team_code = ? where lecture_room_code = ? and time_code = ?" // 강의실에 팀 배정
  var sql13 = "update apply_matching set match_status = ? where apply_code = ?" // 신청한사람 신청 상태 y로 변경
  var sql14 = "update apply_matching set match_status = ? where ID=? and use_available_language_name =? and wnat_language_name = ?" // 매칭된사람 신청 상태 y로 변경
  var sql15 = "update user set team_matching_count = team_matching_count + 1 where ID = ?"
  var sql16 = "select * from user where ID=?"

  conn.query(sql16, [sess.userID], function (err, row16) {
    if (row16[0].caution_count >= 3) {
      res.send('<script>alert("경고횟수가 초과하여 매칭신청할 수 없습니다.");history.back();</script>')
    } else {
      if (row16[0].grade == 'bronze' && row16[0].team_matching_count == 1) {
        res.send('<script>alert("팀 매칭횟수를 초과했습니다.");history.back();</script>')
      } else if (row16[0].grade == 'silver' && row16[0].team_matching_count == 2) {
        res.send('<script>alert("팀 매칭횟수를 초과했습니다.");history.back();</script>')
      } else if (row16[0].grade == 'gold' && row16[0].team_matching_count == 3) {
        res.send('<script>alert("팀 매칭횟수를 초과했습니다.");history.back();</script>')
      } else {
        if (body.select_time == undefined || body.select_time.length < 4) {
          res.send('<script>alert("시간표를 4개이상 선택하세요");history.back();</script>')
        } else if (body.available_language == body.wnat_language) {
          res.send('<script>alert("다른언어를 선택하세요");history.back();</script>')
        } else {
          conn.query(sql1, [sess.userID, body.available_language, body.wnat_language], function (err, row1) {
            conn.query(sql2, function (err, row2) {
              var code = row2[0].code
              console.log(body.wnat_language, body.available_language, code);

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
                          stArr[count] = r5.time_code
                          count = count + 1;
                          if (count >= 4) {
                            theEnd = true;
                            name = r4.ID
                            console.log("나와 매칭될 사람은 바로 이사람!!", name);
                            conn.query(sql15, [sess.userID], function (err, row15) {
                              conn.query(sql15, [name], function (err, row16) {
                                plus = true
                              })
                            })
                            conn.query(sql6, [date, week], function (err, row6) {
                              conn.query(sql2, function (err, row7) {
                                conn.query(sql8, [sess.userID, row7[0].code, body.wnat_language], function (err, row8) {
                                  conn.query(sql8, [name, row7[0].code, body.available_language], function (err, row9) {
                                    stArr.forEach(st3 => {
                                      conn.query(sql10, [st3], function (err, row10) {
                                        conn.query(sql12, [row7[0].code, row10[0].lecture_room_code, st3], function (err, row12) {
                                          conn.query(sql13, ['y', code], function (err, row13) {
                                            console.log("이름이 뭐에요~?", name);
                                            conn.query(sql14, ['y', name, body.wnat_language, body.available_language], function (err, row14) {
                                            })
                                          })
                                        })
                                      })
                                    })
                                  })
                                })
                              })
                            })
                            return true;
                          }
                        }
                      })
                    })
                  });
                })
                res.redirect("/");
              });
            });
          });
        }
      }
    }
  })
});


//------------post 영역 관리자

//댓글등록
router.post('/addReply', function (req, res, next) {
  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();


  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }

  var date = yyyy.toString() + mm.toString() + dd.toString();

  var sess = req.session
  var activityLog_code = req.body.activityLog_code;
  var body = req.body
  var sql = "insert into reply (reply_contents,activityLog_code,reply_date) values (?,?,?)"
  conn.query(sql, [body.replyContents, body.activityLog_code, date], function (err, row) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect(`/activityLogList/activityLogDetail/${activityLog_code}`);
    }
  });
});

//점수 업데이트
router.post('/addScore', function (req, res, next) {
  var sess = req.session
  var activityLog_code = req.body.activityLog_code;
  var body = req.body
  var sql = "update activitylog set receive_score = 100 WHERE activityLog_code = ?"
  var sql1 = "select user.score FROM user, activitylog WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql2 = "update user, activitylog set score = ? WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql3 = "select user.score FROM user, activitylog WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql4 = "update user, activitylog set grade = ? WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  conn.query(sql, [activityLog_code], function (err, row) {
    if (err) {
      console.log(err);
    }
    else {
      conn.query(sql1, [activityLog_code], (err, row1) => {
        if (err) { console.log(err) }
        else {
          conn.query(sql2, [Number(row1[0].score) + Number(100), activityLog_code], (err, row2) => {
            if (err) { console.log(err) }
            else {
              conn.query(sql3, [activityLog_code], (err, row3) => {
                var grade;
                if (err) { console.log(err); }
                else {
                  if (Number(row3[0].score) < 1000) {
                    grade = 'bronze';
                  } else if (Number(row3[0].score) >= 1000 && Number(row3[0].score) < 3000) {
                    grade = 'silver';
                  }
                  else if (Number(row3[0].score) >= 3000) {
                    grade = 'gold';
                  }
                  conn.query(sql4, [grade, activityLog_code], (err, row4) => {
                    console.log("g : " + grade);
                    if (err) { console.log(err); }
                    else {
                      res.redirect(`/activityLogList/activityLogDetail/${activityLog_code}`);
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  });
});

//수정 통보 업데이트
router.post('/addUpdateState', function (req, res, next) {
  var activityLog_code = req.body.activityLog_code;
  var sql = "update activitylog set activityLog_update_yes_no = 'y'  WHERE activityLog_code = ?"
  conn.query(sql, [activityLog_code], function (err, row) {
    if (err) {
      console.log(err);
    }
    else {
      res.redirect(`/activityLogList/activityLogDetail/${activityLog_code}`);
    }
  });
});

//댓글 업데이트
router.post('/updateReply', function (req, res, next) {
  var activityLog_code = req.body.activityLog_code;
  var sql = "update reply set reply_contents = ? where activityLog_code = ?"
  var sql2 = "update activitylog set activityLog_update_yes_no = 'n',receive_score = 100 where activityLog_code = ?"
  var sql3 = "select user.score FROM user, activitylog WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql4 = "update user, activitylog set score = ? WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql5 = "select user.score FROM user, activitylog WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  var sql6 = "update user, activitylog set grade = ? WHERE activitylog.activityLog_code = ? AND activitylog.ID = user.ID"
  conn.query(sql, [req.body.replyContents, activityLog_code], function (err, row) {
    if (err) {
      console.log(err);
    }
    conn.query(sql2, [activityLog_code], function (err, row) {
      if (err) {
        console.log(err);
      }
      else {
        conn.query(sql3, [activityLog_code], (err, row1) => {
          if (err) { console.log(err) }
          else {
            conn.query(sql4, [Number(row1[0].score) + Number(100), activityLog_code], (err, row2) => {
              if (err) { console.log(err) }
              else {
                conn.query(sql5, [activityLog_code], (err, row3) => {
                  var grade;
                  if (err) { console.log(err); }
                  else {
                    if (Number(row3[0].score) < 1000) {
                      grade = 'bronze';
                    } else if (Number(row3[0].score) >= 1000 && Number(row3[0].score) < 3000) {
                      grade = 'silver';
                    }
                    else if (Number(row3[0].score) >= 3000) {
                      grade = 'gold';
                    }
                    conn.query(sql6, [grade, activityLog_code], (err, row4) => {
                      console.log("g : " + grade);
                      if (err) { console.log(err); }
                      else {
                        res.redirect(`/activityLogUpdateList/activityLogUpdateDetail/${activityLog_code}`);
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
    // else {
    //   res.redirect(`/activityLogUpdateList/activityLogUpdateDetail/${activityLog_code}`);
    // }
  });
});



//한국인로그인
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
        sess.name = row[0].name
        sess.grade= row[0].grade
        res.redirect("/");
      }
    }
  });
});

//외국인로그인
router.post('/Flogin', function (req, res, next) {
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
        res.write("<script> alert('Incorrect input.'); history.back(); </script>");
      }
      else {
        sess.userID = row[0].ID
        sess.name = row[0].name
        sess.grade= row[0].grade
        res.redirect("/");
      }
    }
  });
});


//회원가입
router.post('/signup', function (req, res, next) {
  var body = req.body
  var sql = "insert into user (ID,PW,major,student_no,name,phone_no,nationality_division) values (?,?,?,?,?,?,1)"
  conn.query(sql, [body.id, body.pw, body.major, body.student_no, body.name, body.phone_no], function (err, row) {
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

//회원가입
router.post('/Fsignup', function (req, res, next) {
  var body = req.body
  var sql = "insert into user (ID,PW,major,student_no,name,phone_no,nationality_division) values (?,?,?,?,?,?,0)"
  conn.query(sql, [body.id, body.pw, body.major, body.student_no, body.name, body.phone_no], function (err, row) {
    if (err) {
      console.log(err);

      console.log("회원가입에러", body.id, body.grade, body.pw, body.major, body.student_no, body.name, body.phone_no);

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('Duplicate ID...'); history.back(); </script>");
    }
    else {
      res.redirect("/Flogin");
    }
  });
});

//활동일지 등록
router.post('/activityLog_regist/:team_num', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();


  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }

  var date = yyyy.toString() + mm.toString() + dd.toString();
  var week = moment(date, "YYYYMMDD").week();

  var sql1 = "select * from team_member where ID=?"
  var sql2 = "insert into activityLog (activityLog_date,activityLog_week,activityLog_week_count,activityLog_contents,ID,team_code) values (?,?,?,?,?,?)";


  conn.query(sql1, [sess.userID], function (err, row1) {
    conn.query(sql2, [date * 1, week, body.week_count, body.activityLog_contents, sess.userID, req.params.team_num], function (err, row2) {
      res.redirect(`/mypage/matching/activityLog/${req.params.team_num}`);
    })
  })
});

//신청삭제
router.post('/deleteApply/:apply_code', function (req, res, next) {
  var body = req.body
  var sql1 = "delete from apply_matching where apply_code = ?"
  var sql2 = "delete from apply_time where apply_code = ?"
  conn.query(sql1, [req.params.apply_code], function (err, row1) {
    conn.query(sql2, [req.params.apply_code], function (err, row2) {
      res.redirect(`/mypage`);
    })
  })
});

//팀 매칭 시간 수정
router.post('/teamMatchingUpdate/:team_code', function (req, res, next) {

  var stArr = req.body.select_time
  if (stArr.length != 4) {
    res.send('<script>alert("시간표를 4개이상 선택하세요");history.back();</script>')
  } else {

    var sql1 = "UPDATE lecture_room_class SET team_code = ? WHERE team_code = ?"
    var sql2 = "select * from lecture_room_class where time_code = ? and team_code is null or team_code=?"
    var sql3 = "update lecture_room_class set team_code = ? where lecture_room_code = ? and time_code = ?"
    conn.query(sql1, [null, req.params.team_code * 1], function (err, row1) {
      stArr.forEach(st => {
        console.log(st * 1, req.params.team_code * 1);
        conn.query(sql2, [st * 1, req.params.team_code * 1], function (err, row2) {
          console.log(st, '번째', req.params.team_code * 1, row2[0].lecture_room_code, st * 1);
          conn.query(sql3, [req.params.team_code * 1, row2[0].lecture_room_code, st * 1], function (err, row12) {

          })
        })
      })
      res.redirect(`/mypage/`);
    })
  }
});

//-------------------------get 영역 관리자

//로그아웃 요청
router.get('/logout', function (req, res, next) {
  var sess = req.session;
  sess.destroy();
  res.redirect('/')
});


//메인페이지
router.get('/', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "select * from user where ID = ? ";
  conn.query(sql, [sess.userID], function (err, row) {
    res.render('./main/index', { page: '../main/index_detail', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: row[0] });
  });

});

//활동일지 목록 페이지
router.get('/activityLogList', function (req, res, next) {
  var sess = req.session
  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();

  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }
  var date = yyyy.toString() + mm.toString() + dd.toString();

  var sql = `select * from activitylog where activityLog_date*1 <='${date * 1}' && activityLog_date*1>'${date * 1 - 8}' order by activityLog_date asc`;
  conn.query(sql, function (err, row) {
    console.log(date)
    res.render('./main/index', { page: '../activityLogList', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: row });
  });
});

//활동일지 상세 페이지
router.get('/activityLogList/activityLogDetail/:activityLog_code', function (req, res, next) {
  var sess = req.session;
  var activityLog_code = req.params.activityLog_code;
  var data = {};

  var sql = "select * from activitylog WHERE activityLog_code= ?"
  var sql2 = "select * from activitylog,reply WHERE activitylog.activityLog_code=reply.activityLog_code AND activitylog.activityLog_code= ?";
  conn.query(sql, [activityLog_code], function (err, row) {
    if (err) {
      throw err;
    }
    data.activity = row[0];
    conn.query(sql2, [activityLog_code], function (err, row) {
      if (err) {
        throw err;
      }
      data.reply = row[0];
      res.render('./main/index', { page: '../activityLogDetail', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: data });
    })

  });
});

//활동일지 수정 목록 페이지
router.get('/activityLogUpdateList', function (req, res, next) {
  var sess = req.session
  var sql = "select * from activitylog where activityLog_update_yes_no = 'y' order by activityLog_date asc";
  conn.query(sql, function (err, row) {
    // console.log(row)
    res.render('./main/index', { page: '../activityLogUpdateList', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: row });
  });
});

//활동일지 수정 상세 페이지
router.get('/activityLogUpdateList/activityLogUpdateDetail/:activityLog_code', function (req, res, next) {
  var sess = req.session;
  var activityLog_code = req.params.activityLog_code;
  var data = {};
  var sql = "select * from activitylog WHERE activityLog_code= ?"
  var sql2 = "select * from activitylog,reply WHERE activitylog.activityLog_code=reply.activityLog_code AND activitylog.activityLog_code= ?";
  conn.query(sql, [activityLog_code], function (err, row) {
    if (err) {
      throw err;
    }
    data.activity = row[0];
    conn.query(sql2, [activityLog_code], function (err, row) {
      if (err) {
        throw err;
      }
      data.reply = row[0];
      res.render('./main/index', { page: '../activityLogUpdateDetail', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: data });
    })
  });
});




//------------------------------------get 영역 사용자

//마이페이지
router.get('/mypage', function (req, res, next) {
  var sess = req.session
  var data = {};
  const data2 = [];
  var sql2 = "select * from apply_matching where ID = ? and match_status = ?"
  var sql4 = "SELECT team_code FROM team_member WHERE ID = ?"
  var sql5 = "SELECT * FROM team,team_member WHERE team.team_code = ? AND team.team_code=team_member.team_code and team_member.ID !=?"

  conn.query(sql2, [sess.userID, 'n'], function (err, row) {
    if (err) throw err;
    data.apply = row;
    conn.query(sql4, [sess.userID], (err, row1) => {
      console.log('확인이요1', row1);
      if (row1.length == 0) {
        res.render('./main/index', { page: '../mypage', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: data,isNull:0 });
      } else {
        if (err) { console.log(err) }
        else {
          row1.forEach(e1 => {
            conn.query(sql5, [e1.team_code, sess.userID], (err, row2) => {
              console.log('확인이요2', row2);
              if (err) { console.log(err) }
              else {
                data2.push(row2[0]);
                if (row1.length == data2.length) {
                  console.log(row1);
                  console.log(data2);
                  data.member2 = data2;
                  res.render('./main/index', { page: '../mypage', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: data ,isNull:data2.length});
                }
              }
            })
          })
        }
      }
    })
  })
})

//팀 상세 페이지(사용자)
router.get('/mypage/matching/:team_code', function (req, res, next) {
  var sess = req.session;
  var team_code = req.params.team_code;
  var sql = "SELECT * from team, team_member, user, lecture_room_class WHERE team.team_code = ? AND team.team_code = team_member.team_code AND team_member.ID = user.ID AND lecture_room_class.team_code = team.team_code order by lecture_room_class.time_code";
  conn.query(sql, [team_code], function (err, row) {
    if (err) { console.log(err) }
    res.render('./main/index', { page: '../matchingDetail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, data: row, team_code: req.params.team_code });
  });
});

//활동일지 목록 페이지(사용자)
router.get('/mypage/matching/activityLog/:team_code', function (req, res, next) {
  var sess = req.session
  var team_code = req.params.team_code
  var sql = "select * from activityLog,team where activitylog.team_code = team.team_code AND team.team_code =? AND activitylog.ID = ? order by activitylog_date desc";
  conn.query(sql, [team_code, sess.userID], function (err, row) {
    console.log(err);
    console.log(row.length);
    res.render('./main/index', { page: '../activityLogListUser', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: row, isNull: row.length, team_code: team_code });
  });
});

//활동일지 상세 페이지(사용자)
router.get('/mypage/matching/activityLog/detail/:activityLog_code', function (req, res, next) {
  var sess = req.session
  var data = {};
  var activityLog_code = req.params.activityLog_code
  var sql = "select * from activitylog where activityLog_code = ?";
  var sql2 = "select * from activitylog,reply WHERE activitylog.activityLog_code=reply.activityLog_code AND activitylog.activityLog_code= ?";
  conn.query(sql, [activityLog_code], function (err, row) {
    data.activity = row[0];
    conn.query(sql2, [activityLog_code], function (err, row) {
      data.reply = row[0]
      console.log(data)
      res.render('./main/index', { page: '../activityLogDetailUser', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: data });
    })

  });
});

//활동일지 수정페이지(사용자)
router.get('/mypage/matching/activityLog/detail/update/:activityLog_code', function (req, res, next) {
  var activityLog_code = req.params.activityLog_code;
  var sess = req.session
  var sql = "select * from activitylog where activityLog_code = ?"
  conn.query(sql, [activityLog_code], function (err, row) {
    res.render('./main/index', { page: '../activityLogUpdateUser', title: '외국인 유학생과 함깨하는 해화 매칭 시스템', users: sess, data: row });
  })
});

//한국로그인페이지
router.get('/login', function (req, res, next) {
  res.render('./login/login', { title: '외국인 유학생과 함깨하는 해화 매칭 시스템' });
});

//외국로그인페이지
router.get('/Flogin', function (req, res, next) {
  res.render('./Flogin/Flogin', { title: '외국인 유학생과 함깨하는 해화 매칭 시스템' });
});

//한국인회원가입
router.get('/signup', function (req, res, next) {
  res.render('./signup/signup', { title: '외국인 유학생과 함깨하는 해화 매칭 시스템' });
});

//외국인회원가입
router.get('/Fsignup', function (req, res, next) {
  res.render('./Fsignup/Fsignup', { title: '외국인 유학생과 함깨하는 해화 매칭 시스템' });
});

//팀매칭신청
router.get('/apply_matching', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql1 = "select * from user where id = ? ";
  var sql2 = "select * from language";
  var sql3 = "SELECT DISTINCT time_code FROM lecture_room_class where team_code is null"
  conn.query(sql1, [sess.userID], function (err, row1) {
    conn.query(sql2, [sess.userID], function (err, row2) {
      conn.query(sql3, [sess.userID], function (err, row3) {
        console.log('강의실 시간?', row3)
        res.render('./apply_matching/apply_matching', { page: '../apply_matching/apply_matching_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: row1[0], language: row2, ct: row3 });
      });
    });
  });
});

//활동일지 등록
router.get('/activity_log_regist/:team_num', function (req, res, next) {
  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();


  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }
  var date = yyyy.toString() + mm.toString() + dd.toString();
  var week = moment(date, "YYYYMMDD").week();

  var sess = req.session
  var sql = "select * from lecture_room_class,time where lecture_room_class.time_code=time.time_code and lecture_room_class.team_code=?"
  var sql2 = "select * from activitylog where activityLog_week=? and team_code=? and ID=?"
  conn.query(sql, [req.params.team_num], function (err, row) {
    conn.query(sql2, [week, req.params.team_num, sess.userID], function (err, row2) {
      console.log('asdasdasd', row2);
      res.render('./activity_log_regist/activity_log_regist', { page: '../activity_log_regist/activity_log_regist_detail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, class_time: row, week_count: row2 });
    })
  })
});

//신고 등록
router.post('/registerWarning/:team_code', function (req, res, next) {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd
  }
  if (mm < 10) {
    mm = '0' + mm
  }
  today = yyyy.toString() + mm.toString() + dd.toString();

  var sess = req.session
  var body = req.body
  var team_code = req.params.team_code;
  var sql1 = `SELECT * FROM team, team_member WHERE team.team_code = team_member.team_code AND team.team_code = ? AND team_member.ID != ?`
  var sql2 = "INSERT INTO `warning`(`warning_reason`, `warning_date`, `warningedID`, `warningID`,`team_code`) VALUES (?, ?, ?, ?, ?)"
  conn.query(sql1, [team_code, sess.userID], function (err, row) {
    if (err) {
      console.log(err);
    }
    else {
      conn.query(sql2, [body.warning_reason, today, row[0].ID, sess.userID, team_code], (err, result) => {
        if (err) {
          console.log(err);
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
          res.write("<script> alert('오류'); history.back(); </script>");
        }
        else {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
          res.write("<script> alert('신고가 등록되었습니다. '); history.back(); </script>");
        }
      })
    }
  });
});

//신고목록 화면
router.get('/warningList', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql1 = `SELECT * FROM warning`
  conn.query(sql1, function (err, data) {
    console.log(data);
    if (err) {
      console.log(err);
    }
    else {
      res.render('./main/index', { page: '../warningList', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, data: data });
    }
  });
});

//신고상세 화면
router.get('/warningListDetail/:warning_code', function (req, res, next) {
  var sess = req.session;
  var body = req.body;
  var warning_code = req.params.warning_code;

  var sql1 = "SELECT * FROM warning WHERE warning_code = ?"
  conn.query(sql1, [warning_code], function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      res.render('./main/index', { page: '../warningListDetail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, data: data });
    }
  });
});

//신고 수락
router.get('/warningAcceptance/:warning_code/:team_code', function (req, res, next) {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = '0' + dd
  }
  if (mm < 10) {
    mm = '0' + mm
  }
  today = yyyy.toString() + mm.toString() + dd.toString();

  var sess = req.session;
  var body = req.body;
  var warning_code = req.params.warning_code;
  var team_code = req.params.team_code;
  var sql1 = "SELECT * FROM warning, user WHERE warning.warning_code = ? AND warning.warningedID = user.ID"
  var sql2 = "UPDATE user, warning SET caution_count = ? WHERE warning.warning_code = ? AND warning.warningedID = user.ID"
  var sql3 = "SELECT * FROM warning, user WHERE warning.warning_code = ? AND warning.warningID = user.ID"
  var sql4 = "UPDATE user, warning SET team_matching_count = ? WHERE warning.warning_code = ? AND warning.warningID = user.ID"
  var sql5 = "UPDATE team SET team_keep_dismantle_yes_no = 'y', team_keep_dismantle_date = ? WHERE team.team_code = ?"
  var sql6 = "UPDATE lecture_room_class SET team_code = Null WHERE team_code = ?"
  var sql7 = "UPDATE warning SET warning_state = 1 WHERE warning_code = ?"

  conn.query(sql1, [warning_code], function (err, data1) {
    if (err) {
      console.log("1", err);
    }
    else {
      console.log((Number(data1[0].caution_count) + Number(1)));
      console.log((Number(data1[0].caution_count) + 1));
      conn.query(sql2, [(Number(data1[0].caution_count) + Number(1)), warning_code], (err, data2) => {
        if (err) {
          console.log("2", err);
        }
        else {
          conn.query(sql3, [warning_code], (err, data3) => {
            if (err) {
              console.log("3", err);
            }
            else {
              console.log((Number(data3[0].team_matching_count) - Number(1)));
              conn.query(sql4, [(Number(data3[0].team_matching_count) - Number(1)), warning_code], (err, data4) => {
                if (err) {
                  console.log("4", err);
                }
                else {
                  conn.query(sql5, [today, team_code], (err, data5) => {
                    if (err) {
                      console.log("5", err);
                    }
                    else {
                      conn.query(sql6, [team_code], (err, data6) => {
                        if (err) {
                          console.log("6", err);
                        }
                        else {
                          conn.query(sql7, [warning_code], (err, data7) => {
                            if (err) {
                              console.log("7", err);
                            }
                            else {
                              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
                              res.write(`<script> alert('신고 요청을 수락하였습니다. 해당 팀이 해체되었습니다. '); location.href = '/warningListDetail/${warning_code}'</script>`);
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  });
});

//신고 취소
router.get('/warningCancle/:warning_code', function (req, res, next) {
  var sess = req.session;
  var body = req.body;
  var warning_code = req.params.warning_code;

  var sql1 = "UPDATE warning SET warning_state = 1 WHERE warning_code = ? "
  conn.query(sql1, [warning_code], function (err, data) {
    if (err) {
      console.log(err);
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('신고 요청을 거절하였습니다. '); location.href = '/warningListDetail/${warning_code}' </script>`);
    }
  });
});

//신청 정보 화면
router.get('/mypage/apply/:apply_code', function (req, res, next) {
  var sess = req.session;
  var body = req.body;

  var sql = "SELECT * FROM user,apply_matching,apply_time WHERE user.ID = apply_matching.ID and apply_matching.apply_code = apply_time.apply_code and apply_time.apply_code=?"
  conn.query(sql, [req.params.apply_code], function (err, row) {
    res.render('./main/index', { page: '../applyDetail', title: '외국인 유학생과 함께하는 회화 매칭 시스템', data: row, users: sess });
  });
});

router.get('/mypage/matching/updateTeamData/:team_code', function (req, res, next) {
  var sess = req.session;
  var team_code = req.params.team_code;
  var sql = "SELECT * from team, team_member, user, lecture_room_class WHERE team.team_code = ? AND team.team_code = team_member.team_code AND team_member.ID = user.ID AND lecture_room_class.team_code = team.team_code order by lecture_room_class.time_code";
  var sql2 = "SELECT DISTINCT time_code FROM lecture_room_class where team_code is null or team_code = ? "
  conn.query(sql, [team_code], function (err, row) {
    conn.query(sql2, [req.params.apply_code, req.param.team_code], function (err, row2) {
      res.render('./main/index', { page: '../teamMatchingUpdate', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, data: row, class_time: row2 });
    });
  });
});

//활동 현황
router.get('/activityLog', function (req, res, next) {
  var date = new Date();

  var dd = date.getDate();
  var dd2 = date.getDate() - 6;
  var mm = date.getMonth() + 1;
  var yyyy = date.getFullYear();


  if (dd < 10) {
    dd = '0' + dd
  }
  if (dd2 < 10) {
    dd2 = '0' + dd
  }
  var date = yyyy.toString() + mm.toString() + dd.toString();
  var week = moment(date, "YYYYMMDD").week();

  var sess = req.session;
  var sql1 = "SELECT activitylog.team_code, activitylog.ID, activitylog.activityLog_week, activitylog.activityLog_week_count, activitylog.receive_score, activitylog.activityLog_update_yes_no, team.team_matched_week, team.team_keep_dismantle_yes_no  FROM activitylog, team WHERE activitylog.team_code = team.team_code order by activitylog.team_code asc, activitylog.ID asc, activitylog.activityLog_week asc, activityLog_week_count asc"

  conn.query(sql1, (err, result) => {
    if (err) { console.log("e1", err) }
    else {
      console.log(result);
      console.log(week)
      res.render('./main/index', { page: '../activityLog', title: '외국인 유학생과 함께하는 회화 매칭 시스템', users: sess, data: result, time: week });
    }
  })
});

module.exports = router;