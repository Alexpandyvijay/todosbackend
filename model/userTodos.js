const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userTodos = new Schema({
    userId : String,
    todosList : [{
        activity : String,
        status : String,
        timeTaken : String,
    }]
})
module.exports = mongoose.model('usertodos',userTodos);