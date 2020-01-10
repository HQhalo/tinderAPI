const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../lib/db.js');
const path = require('path');
const fs = require('fs')

const userMiddleware = require('../middleware/md_users');
router.get('/get',(req, res, next) => {
  res.send('hello');
});
router.post('/sign-up', userMiddleware.validateRegister, (req, res, next) => {
    console.log('user sign up: ')
    console.log(req.body)
    db.query(
        `SELECT * FROM users WHERE LOWER(id) = LOWER(${db.escape( req.body.id)});`,
        (err, result) => {
            if (result.length) {
                return res.send({error: true,msg: 'This username is already in use!'});
            } else {
            // username is available
            bcrypt.hash(req.body.pass, 10, (err, hash) => {
                if (err) {
                    return res.send({error:true,msg: err});
            } else {
                // has hashed pw => add to database
                db.query(
                    `INSERT INTO users (id, pass, nameuser, registered) VALUES (${db.escape(
                    req.body.id)}, ${db.escape(hash)},${db.escape(req.body.nameuser)} ,now())`,
                (err, result) => {
                    if (err) {
                        return res.send({error: true,msg: err.code});
                    }
                    return res.send({error:false,msg: 'Registered!'});
                }
                );
            }
            });
            }
        }
    );    
});
router.post('/login', (req, res, next) => {
  console.log('user login: ')
    console.log(req.body)
    db.query(
        `SELECT * FROM users WHERE id = ${db.escape(req.body.id)};`,
        (err, result) => {
          // user does not exists
          if (err) {
            return res.send({error:true,msg: err.code});
          }
          if (!result.length) {
            return res.send({error:true,msg: 'Username or password is incorrect!'});
          }
          // check password
          bcrypt.compare(
            req.body.pass,
            result[0]['pass'],
            (bErr, bResult) => {
              // wrong password
              if (bErr) {
                return res.send({error:true,msg: 'Username or password is incorrect!'});
              }
              if (bResult) {
                const token = jwt.sign({
                    id: result[0].id                   
                  },
                  'quangahihi', {
                    expiresIn: '7d'
                  }
                );
                db.query(
                  `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                );
                return res.send({error:false,
                  msg: 'Logged in!',
                  token,
                  user: result[0]
                });
              }
              return res.send({error:true,
                msg: 'Username or password is incorrect!'
              });
            }
          );
        }
      );
});
router.post('/update-infor',userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);
  db.query(
    `UPDATE users SET ? WHERE id = '${req.userData.id}'`,req.body,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.send({error:true,msg: 'something wrong!'});
      }
      if (!result.length) {
        return res.send({error:false,msg: 'update!'});
      }
    });
});

router.get('/list-users',userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT * FROM users WHERE id <> ${db.escape(req.userData.id)} 
    AND users.gender <> (SELECT gender FROM users WHERE id =${db.escape(req.userData.id)});`,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.send({error:true,msg: err.code});
      }
      res.send({error: false,
        msg: 'get list successfully',
        userlist:result
      })
    });
});

router.get('/list-liked',userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT user_id FROM likes WHERE liked_user = ${db.escape(req.userData.id)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.send({error:true,msg: err.code});
      }
      res.send({error: false,
        msg: 'get liked successfully',
        userlist:result
      })
    });
});

router.get('/list-superliked',userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT user_id FROM superlikes WHERE superliked_user = ${db.escape(req.userData.id)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.send({error:true,msg: err.code});
      }
      res.send({error: false,
        msg: 'get superliked successfully',
        userlist:result
      })
    });
});

router.post('/upload-avatar', userMiddleware.isLoggedIn,async (req, res) => {
  console.log("upload avatar:"+req.userData);

  try {
      if(!req.files) {
          console.log("no file");
          return res.send({error:true,msg: 'something wrong!'});
      } else {
          //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
          let avatar = req.files.avatar;
          
          //Use the mv() method to place the file in upload directory (i.e. "uploads")
          
          filename = 'avatar-'+Date.now()+path.extname(avatar.name);
          console.log(path.join(__dirname, '../uploads/',filename));
          avatar.mv(path.join(__dirname, '../uploads/',filename));
          db.query(
            `UPDATE users SET avatar = '${filename}' WHERE id = '${req.userData.id}'`
          );
          //send response
          res.send({error:false,
              msg: 'File is uploaded',
              data: {
                  name: filename,
                  mimetype: avatar.mimetype,
                  size: avatar.size
              }
          });
      }
  } catch (err) {
      res.send({error:true,msg: 'something wrong!'});
  }
});


router.get('/download-avatar', userMiddleware.isLoggedIn,(req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT avatar FROM users WHERE id = ${db.escape(req.userData.id)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        // res.status(400).send({error:true,msg: 'something wrong!'});
        res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

      }
      
      if (result.length != 0) {
      if(result[0].avatar){
        console.log(result[0].avatar)
        fs.access(path.join(__dirname, '../uploads/',result[0].avatar), fs.F_OK, (err) => {
          if (err) {
            console.log("file is not exist!")
            // res.status(400).send({error:true,msg: 'something wrong!'});
            res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));
            return
          }else {
            res.sendFile(path.join(__dirname, '../uploads/',result[0].avatar));
          }
        });
        
      }
      else {
        // res.status(400).send({error:true,msg: 'something wrong!'});
        res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

      }
    }
    else {
      // res.status(400).send({error:true,msg: 'something wrong!'});
      res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

    }
  });
});

router.get('/download-avatar-users', (req, res, next) => {
  var iduser = req.headers.authorization.split(' ')[1];
  console.log(iduser);
  
  db.query(
    `SELECT avatar FROM users WHERE id = ${db.escape(iduser)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        // res.status(400).send({error:true,msg: 'something wrong!'});
        res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

      }
      
      if (result.length != 0) {
      if(result[0].avatar){
        console.log(result[0].avatar)
        fs.access(path.join(__dirname, '../uploads/',result[0].avatar), fs.F_OK, (err) => {
          if (err) {
            console.log("file is not exist!")
            // res.status(400).send({error:true,msg: 'something wrong!'});
            res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

            return
          }else {
            res.sendFile(path.join(__dirname, '../uploads/',result[0].avatar));
          }
        });
        
      }
      else {
        res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));
        
        // res.status(400).send({error:true,msg: 'something wrong!'});
      }
    }
    else {
      // res.status(400).send({error:true,msg: 'something wrong!'});
      res.sendFile(path.join(__dirname, '../uploads/','avatar-non.png'));

    }
  });
});



router.post('/like',userMiddleware.isLoggedIn,(req,res,next)=>{
  console.log('like');
  var idLikedUser = req.body.id;
  console.log(idLikedUser)
  console.log(req.userData.id)
  db.query(
    `SELECT * FROM users WHERE LOWER(id) = LOWER(${db.escape( req.body.id)});`,
    (err, result) => {
      
        if (!result.length) {
            return res.send({error: true,msg: 'This username is not exist!'});
        } else {
          db.query(
            `INSERT INTO likes (user_id, liked_user,datelike) VALUES (${db.escape( req.userData.id)},${db.escape(
            req.body.id)} ,now())`,
            (err, result) => {
              if (err) {
                  return res.send({error: true,msg: err.code});
              }
              return res.send({error:false,msg: 'liked!'});
          });
        }
  });
});
router.post('/un-like',userMiddleware.isLoggedIn,(req,res,next)=>{
  console.log('unlike');
  var idLikedUser = req.body.id;
  console.log(idLikedUser)
  console.log(req.userData.id)
  db.query(
    `DELETE FROM likes WHERE LOWER(user_id) = LOWER(${db.escape( req.userData.id)}) AND LOWER(liked_user) = LOWER(${db.escape( idLikedUser)});`,
    (err, result) => {
      if (err) {
        return res.send({error: true,msg: "something wrong!"});
    }
    else {
      res.send({error:false,msg: 'unliked!'});
    }
    
  });
});

router.post('/superlike',userMiddleware.isLoggedIn,(req,res,next)=>{
  console.log('like');
  var idLikedUser = req.body.id;
  console.log(idLikedUser)
  console.log(req.userData.id)
  db.query(
    `SELECT * FROM users WHERE LOWER(id) = LOWER(${db.escape( req.body.id)});`,
    (err, result) => {
      
        if (!result.length) {
            return res.send({error: true,msg: 'This username is not exist!'});
        } else {
          db.query(
            `INSERT INTO superlikes (user_id, superliked_user,datelike) VALUES (${db.escape( req.userData.id)},${db.escape(
            req.body.id)} ,now())`,
            (err, result) => {
              if (err) {
                  return res.send({error: true,msg: err.code});
              }
              return res.send({error:false,msg: 'liked!'});
          });
        }
  });
});

router.post('/un-superlike',userMiddleware.isLoggedIn,(req,res,next)=>{
  console.log('unsuperlike');
  var idLikedUser = req.body.id;
  console.log(idLikedUser)
  console.log(req.userData.id)
  db.query(
    `DELETE FROM superlikes	 WHERE LOWER(user_id) = LOWER(${db.escape( req.userData.id)}) AND LOWER(superliked_user) = LOWER(${db.escape( idLikedUser)});`,
    (err, result) => {
      if (err) {
        return res.send({error: true,msg: "something wrong!"});
    }
    else {
      res.send({error:false,msg: 'unsuperliked!'});
    }
    
  });
});
module.exports = router;