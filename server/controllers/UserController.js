const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const Secret=process.env.SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken')
const {checkPassword} = require('../helpers/encryptPass')

class UserController{


    static create(req, res, next){
        
        const {username ,email, password} = req.body
        console.log(username)
        
        User.create({username, email, password})
        .then(user=>{
            let userdata = {
                'username' : user.username,
                'id' : user._id,
                'email' : user.email
            }
            let token = jwt.sign(userdata,Secret)
            res.status(201).json({token,username:user.username,tags:user.tags})       
        })
        .catch(next)
    }

    static GooglesignIn(req, res, next){

        // console.log(req.body.idToken)
       
        client.verifyIdToken({
            idToken : req.body.idToken,
            audience : GOOGLE_CLIENT_ID
        })
        .then( function (ticket){
            // console.log(ticket.getPayload())
            const {email, name} = ticket.getPayload()
            
        User.findOne( {email})
        .then(user =>{
            if(!user){
                return User.create({
                    'username' : name,
                    'email' : email,
                    'password' : "tameImpala"
                })
            }
            else{
                return user
            }
        })
        .then( user=> {
            let userdata = {
                'username' : user.username,
                'id' : user._id,
                'email' : user.email
            }
            
            let token = jwt.sign(userdata,Secret)
            res.json({token})       
        })
        .catch(next)
        
    }).catch(next)

    }

    static login(req, res, next){

        const {email, password} = req.body
        
        User.findOne({email})
        .then(user=>{

            if (!user){
                
                next({status:404, message:"you haven't registered"})
            }

            else if (checkPassword(password,user.password)){
                let userdata = {
                    'username' : user.username,
                    'id' : user._id,
                    'email' : user.email
                }
                let token = jwt.sign(userdata,Secret)
                res.status(200).json({token,username:user.username,tags:user.tags})       
                
            }
            else{
                next({status:400, message:"invalid email/password"})
            }
            
        })
        .catch(next)
    }

    static update(req,res,next){

        let id = req.decode.id
        // let tags = req.body.tags
        let updatedData = {}
        req.body.tags && (updatedData.tags = req.body.tags)

        User.findByIdAndUpdate(id,updatedData,{new: true})
        .then(theuser=>{
            res.status(200).json(theuser)
        })
        .catch(next)
    }

    static getUser(req, res, next){
        
        let id = req.decode.id
        User.findById(id).select("tags")
        .then(user=>{
            res.status(200).json(user)
        })
        .catch(next)
    }
}

module.exports = UserController
