const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {hash,compare} = require('bcrypt');
const {sign,verify} = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
require("dotenv").config();
const userAuth = require('./model/userDetail.js');
const userTodos = require('./model/userTodos.js');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());


router.post('/',async (req,res)=>{
    const {userId , password} = req.body;
    let userExist = await userAuth.findOne({userId : userId});
    if(!userExist){
        res.json({
            status : 'failed',
            message : 'Invalid userName'
        })
    }else{
        if(await compare(password,userExist.password)){
            const token = sign({userId},process.env.JWT_SECRET_KEY);
            res.json({
                status : 'success',
                message : 'authenticated successfully',
                token
            })
        }else{
            res.json({
                status : 'failed',
                message : 'Incorrect password'
            })
        }
    }
})

router.post('/signup', async (req,res)=>{
    const {userId , password} = req.body;
    let userExist  = await userAuth.findOne({userId : userId});
    if(userExist){
        res.json({
            status : 'failed',
            message : 'user already exist'
        })
    }else{
        const hashedpassword  = await hash(password,10);
        const newUser = {
            userId : userId,
            password : hashedpassword
        }
        userAuth.create(newUser, (err)=>{
            if(err){
                res.json({
                    status : 'failed',
                    message : 'try again'
                })
            }else{
                res.json({
                    status : 'success',
                    message : 'user registered successfully'
                })
            }
        })
    }
})

router.get('/todos',async (req,res)=>{
    let token = req.headers['authorization'];
    if(!token){
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }else{
        let {userId} = verify(token,process.env.JWT_SECRET_KEY);
        let userExistInUserAuth = await userAuth.findOne({userId : userId});
        
        if(userExistInUserAuth){
            let userExist = await userTodos.findOne({userId : userId});
            if(userExist){
                res.json({
                    status : 'success',
                    message : 'todos',
                    data : userExist
                })
            }else{
                res.json({
                    status : 'success',
                    message : 'no todos'
                })
            }
        }else{
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }
    }
})

router.post('/addtodos', async (req,res)=>{
    const newTodos = {...req.body};
    let token = req.headers['authorization'];
    if(token){
        let {userId} = verify(token,process.env.JWT_SECRET_KEY);
        if(!userId){
            res.json({
                status : 'failed',
                message : "unauthorized"
            })
        }else{
            let userExistInUserAuth = await userAuth.findOne({userId : userId});
            if(userExistInUserAuth){
                let userTask = await userTodos.findOne({userId : userId});
                if(userTask){
                    userTodos.findOneAndUpdate({userId : userId},{
                        $push : {
                            todosList : newTodos
                        }
                    },(err,docs)=>{
                        if(err){
                            res.json({
                                status : 'failed',
                                message : err
                            })
                        }else{
                            res.json({
                                status : 'success',
                                message : 'todods appended successfully',
                                data : docs
                            })
                        }
                    })
                }else{
                    let newUserToAddActivity = {
                        userId : userId,
                        todosList : [
                            {
                                activity : req.body.activity,
                                status : req.body.status,
                                timeTaken : req.body.timeTaken
                            }
                        ]
                    }
                    userTodos.create(newUserToAddActivity , (err,docs)=>{
                        if(err){
                            res.json({
                                status : 'failed',
                                message : err
                            })
                        }else{
                            res.json({
                                status : 'success',
                                message : 'todos added successfully',
                                data : docs
                            })
                        }
                    })
                }
            }else{
                res.json({
                    status : 'failed',
                    message : 'unauthorized'
                })
            }
        }
    }else{
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }
});

router.put('/updatetodos/:id',(req,res)=>{
    const {status , timeTaken} = req.body;
    let token = req.headers['authorization'];
    let todosId = req.params.id;
    if(!token){
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }else{
        let {userId} = verify(token,process.env.JWT_SECRET_KEY);
        if(!userId){
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }else{
            const query = {userId : userId, "todosList._id" : todosId}
            const update = { $set : {"todosList.$.status":status,"todosList.$.timeTaken":timeTaken}}
            userTodos.updateOne(query,update,(err,docs)=>{
                if(err){
                    res.json({
                        status : 'failed',
                        message : err
                    })
                }else{
                    res.json({
                        status : 'success',
                        message : 'updated successfully',
                        data : docs
                    })
                }
            })
        }
    }

})

app.delete('/delete/:id',(req,res)=>{
    let token = req.headers['authorization'];
    let todosId = req.params.id;
    if(!token){
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }else{
        let {userId} = verify(token,process.env.JWT_SECRET_KEY);
        if(!userId){
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }else{
            userTodos.updateOne({userId : userId},{$pull : {"todosList" : {"_id" : todosId}}},(err,docs)=>{
                if(err){
                    res.json({
                        status : 'failed',
                        message : err
                    })
                }else{
                    res.json({
                        status : 'success',
                        message : 'deleted successfully',
                    })
                }
            })
        }
    }


})

app.use('/',router);
mongoose.connect(process.env.MONGO_URL).then(()=>(console.log('DataBase connected successfully...')));
app.listen(process.env.PORT || 5000,()=>(console.log(`application running on port ${process.env.PORT}`)));
