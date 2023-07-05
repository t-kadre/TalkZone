const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetSchema=new Schema({
    meetingDate:{
        type:String,
        required:true
    },
    meetingTime:{
        type:String,
        required:true
    },
    emailIds:{
        type:[String],
        required:true
    },
    agenda:{
        type:String,
        required:true
    }
})

const Meet=mongoose.model('Meet',meetSchema)
module.exports=Meet;
