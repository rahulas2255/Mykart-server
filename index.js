require("dotenv").config();
const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const {multerMiddleware} = require('./multerMiddleware')
app.use(express.json());
app.use(cors());

const DB_URL = process.env.DB_URL
// Database connection With Mongo Db
mongoose.connect(DB_URL);



//script
app.get('/l',(req,res) => {
    const directory = 'upload/images';
    let array = []
    // Construct the full path to the directory
  const directoryPath = path.join(process.cwd(), directory);

  // Read the files in the directory
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory '${directory}':`, err);
      res.status(500).json(`Error reading directory '${directory}':`, err)
      return;
    }

    // Print the list of files
    files.forEach((file, index) => {
      array.push(`${index + 1}. ${file}`)
     
    });
    res.status(200).json(array)
  });

  });

// API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")

})

// Image Storage Engine

// const storage = multer.diskStorage({
//     destination: './upload/images',
//     filename:(req,file,cb)=>{
//         return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })


// Schema creating for User Modal

const Users = mongoose.model('Users',{
    name:{
        type:String,
        
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    admin:{
        type:Boolean,
        default:false,
    }

})

// Creating Endpoint for registering the user

app.post('/signup',async (req,res)=>{

    let check = await Users.findOne({email:req.body.email});
    if (check){
        return res.status(400).json({success:false,errors:"existing user found with same email"})
    }
    let cart = {};
    for (let i = 0; i < 300;  i++) {
        cart[i]=0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData: cart,
        
    })

    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }
    const token = jwt.sign(data,process.env.secret_Key);
    res.json({success:true,token})
})

// Creating endpoint for user login
app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if(passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,process.env.secret_Key);
            res.json({success:true,token,user})
        }
        else{
            res.json({success:false,errors:"Wrong Password"})
        }
    }else{
        res.json({success:false,errors:"Wrong Email Id"})
    }
})

// creating endpoints for new collection data
app.get('/newcollection',async (req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("New Collection Fetched");
    res.send(newcollection)

})
// creating endpoint for popular in women section
app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:"women"})
    let popular_in_women = products.slice(0,4);
    console.log("Popular in Women Fetched");
    res.send(popular_in_women);
})

// creating middleware to fetch user
   const fetchUser = async (req,res,next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({errors:"Please authenticate using valid token"})
    }else{
        try{
            const data = jwt.verify(token,process.env.secret_Key);
            req.user = data.user;
            next();
        } catch(error){
            res.status(401).send({errors:"Please authenticate using a valid token"})
        }
    }
   }
// creating endpoints for adding products in cartdata
app.post('/addtocart',fetchUser,async (req,res)=>{
    console.log("added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id})
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})
//  creating endpoint to remove product from cartData
app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id})
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})
// Creating endpont to get cartdata
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("GET CART");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);

})
app.delete('/clearcart',fetchUser,async(req,res)=>{
    let userData = await Users.findOne({_id:req.user.id})
    // userData.cartData[req.body.itemId] +=1;
    Object.keys(userData.cartData).forEach((item)=>{
        console.log("Item",item);
        userData.cartData[item]=0
    })
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.json("cleared")

})
    



// const upload = multer({storage:storage})

// Creating Upload Enfpoint for images
app.use('/images',express.static('upload/images'))
app.post("/upload",multerMiddleware.single('product'),(req,res)=>{
    console.log("request",req.path);
    res.json({
        success:1,
        image_url:`${req.file.filename}`
    })
})

// Schema for Creating Products
const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    },

})

app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1
    }else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    })
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating Api for Deleteing products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

// Creating API for getting All products

app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("ALl products Fetched");
    res.send(products);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on Port "+port);
    }else{
        console.log("Error : "+error);
    }
})
