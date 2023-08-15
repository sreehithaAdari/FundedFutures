const mongoose = require("mongoose");

mongoose.connect("mongodb://0.0.0.0:27017/Userdata", {
    useNewUrlParser:true,
    useUnifiedTopology:true,
    
}).then(() => {
    console.log(`connection successful`);
}).catch((e) => {
    console.log(`no connection`,e.message);
})

const organiserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },

   email:{
    type:String ,
    required:true,
    unique:true

   },
    password:{
        type:String,
        required:true
    },

    userType: {
        type: String,
        required: true,
        enum: ["organizer"],
        default: "organizer"
    }
})

const organiser_collection = new mongoose.model("Organiser" , organiserSchema)

module.exports = organiser_collection