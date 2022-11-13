const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userInfo = new Schema({
    userId : {
        type : String, 
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    }
})
module.exports = mongoose.model('userauth',userInfo);