const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('../lib/db.js');
const path = require('path');

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
                return res.status(409).send({msg: 'This username is already in use!'});
            } else {
            // username is available
            bcrypt.hash(req.body.pass, 10, (err, hash) => {
                if (err) {
                    return res.status(500).send({msg: err});
            } else {
                // has hashed pw => add to database
                db.query(
                    `INSERT INTO users (id, pass, nameuser, registered) VALUES (${db.escape(
                    req.body.id)}, ${db.escape(hash)},${db.escape(req.body.nameuser)} ,now())`,
                (err, result) => {
                    if (err) {
                        return res.status(400).send({msg: err.code});
                    }
                    return res.status(201).send({msg: 'Registered!'});
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
            return res.status(400).send({msg: err.code});
          }
          if (!result.length) {
            return res.status(401).send({msg: 'Username or password is incorrect!'});
          }
          // check password
          bcrypt.compare(
            req.body.pass,
            result[0]['pass'],
            (bErr, bResult) => {
              // wrong password
              if (bErr) {
                return res.status(401).send({msg: 'Username or password is incorrect!'});
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
                return res.status(200).send({
                  msg: 'Logged in!',
                  token,
                  user: result[0]
                });
              }
              return res.status(401).send({
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
        return res.status(400).send({msg: 'something wrong!'});
      }
      if (!result.length) {
        return res.status(401).send({msg: 'update!'});
      }
    });
});

router.get('/list-users',userMiddleware.isLoggedIn, (req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT * FROM users WHERE id <> ${db.escape(req.userData.id)} LIMIT 10;`,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.status(400).send({msg: err.code});
      }
      res.status(200).send({
        msg: 'get list successfully',
        userlist:result
      })
    });
});

router.post('/upload-avatar', userMiddleware.isLoggedIn,async (req, res) => {
  console.log(req.userData);

  try {
      if(!req.files) {
          return res.status(400).send('No file uploaded');
      } else {
          //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
          let avatar = req.files.avatar;
          
          //Use the mv() method to place the file in upload directory (i.e. "uploads")
          
          filename = 'avatar-'+Date.now()+path.extname(avatar.name);
          avatar.mv('./uploads/' +filename);
          db.query(
            `UPDATE users SET avatar = '${filename}' WHERE id = '${req.userData.id}'`
          );
          //send response
          res.status(200).send({
              message: 'File is uploaded',
              data: {
                  name: filename,
                  mimetype: avatar.mimetype,
                  size: avatar.size
              }
          });
      }
  } catch (err) {
      res.status(500).send(err);
  }
});
router.get('/download-avatar', userMiddleware.isLoggedIn,(req, res, next) => {
  console.log(req.userData);

  db.query(
    `SELECT avatar FROM users WHERE id = ${db.escape(req.userData.id)};`,
    (err, result) => {
      // user does not exists
      if (err) {
        return res.status(400).send({msg: err.code});
      }
      if(result){
        console.log(result[0].avatar)
        res.sendFile(path.join(__dirname, '../uploads/',result[0].avatar));
      }
      
    });
});
module.exports = router;