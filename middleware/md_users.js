
const jwt = require('jsonwebtoken');

module.exports = {
    validateRegister: (req, res, next) => {
        
      // username min length 3
      if (!req.body.id || req.body.id.length < 6) {
        return res.status(400).send({
          msg: 'Please enter a username with min. 6 chars'
        });
      }
      // password min 6 chars
      if (!req.body.pass || req.body.pass.length < 8) {
        return res.status(400).send({
          msg: 'Please enter a password with min. 8 chars'
        });
      }
      if(!req.body.nameuser){
          return res.status(400).send({
            msg : 'please provide name user'
          });
      }
      // password (repeat) does not match
    //   if (
    //     !req.body.pass_repeat ||
    //     req.body.pass != req.body.pass_repeat
    //   ) {
    //     return res.status(400).send({
    //       msg: 'Both passwords must match'
    //     });
    //   }
      next();
    },

isLoggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        'quangahihi'
      );
      req.userData = decoded;
      next();
    } catch (err) {

      return res.status(401).send({
        msg: 'Your session is not valid!'
      });
    }
  }  
};