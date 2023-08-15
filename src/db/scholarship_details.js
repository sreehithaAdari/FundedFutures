// db/scholarship_conn.js
const mongoose = require("mongoose");

mongoose.connect("mongodb://0.0.0.0:27017/Userdata", {
    useNewUrlParser:true,
    useUnifiedTopology:true,
    
}).then(() => {
    console.log(`connection successful`);
}).catch((e) => {
    console.log(`no connection`,e.message);
})

const scholarshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
   email:{
    type:String ,
    required:true,
       },    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],

  // Add other scholarship details as needed
});

const Scholarship = mongoose.model("Scholarship", scholarshipSchema);

module.exports = Scholarship;
