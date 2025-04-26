const mongoose = require('mongoose');

const connectDB= async ()=>{
    try{
    const conn = await mongoose.connect(process.env.MONGO_URL)
        console.log("MongoDB connected Successfully");
    }catch(err){
        console.error("Mongo Connection failed ", err);
        
    }
        
    
}

module.exports= connectDB;