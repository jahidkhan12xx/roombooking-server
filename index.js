const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 4000


app.use(express.json());
app.use(cors(
  {
    origin: ['http://localhost:5173'],
    credentials: true,
  }
));
app.use(cookieParser());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f3op28d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const roomCollection = client.db("RoyalTaj").collection("Rooms")
    const bookingCollection = client.db("RoyalTaj").collection("Bookings")
    const reviewCollection = client.db("RoyalTaj").collection("Review")



    // verify token function


    const verify = (req,res,next) =>{
      const {token} = req.cookies;

      if(!token){
        return res.status(401).send({message : "unauthorized"})
      }

      jwt.verify(token,process.env.SECRET,function(err,decoded){
        if(err){
          res.status(403).send({message: "forbidden"})
        }
        req.user = decoded;
        next();
      })

      
    }

    app.get("/api/v1/rooms", async (req,res)=>{

      

      let sortObj = {}

      const sortField = req.query.sortField;
      const sortOrder = req.query.sortOrder;

      if(sortField && sortOrder){
        sortObj[sortField] = sortOrder
      }
      const result = await roomCollection.find().sort(sortObj).toArray()
      res.send(result)
    })

    app.get("/api/v1/rooms/:id",async (req,res)=>{
      const id  = req.params.id;
      const query = {
        _id : new ObjectId(id)
      }
      const result = await roomCollection.findOne(query)
      res.send(result)
    })

    app.post("/api/v1/access-token",(req,res)=>{
      const email =req.body;
       const token = jwt.sign(email,process.env.SECRET,{expiresIn : 60*60})

       res.cookie('token',token,{
        httpOnly: true,
        secure:true,
        sameSite:'none'
       }).send()
      console.log(token);
    })

    app.post("/api/v1/bookings", async (req,res)=>{
      const data = req.body;
      const result = await bookingCollection.insertOne(data)
      res.send(result);
    })

    app.patch("/api/v1/bookings/:id", async(req,res)=>{
      const data = req.body.date;
      const id = req.params.id;
      

      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedUSer = {
        $set: {
          "dateFrom" : data,
        },
      };
      const result = await bookingCollection.updateOne(
        filter,
        updatedUSer,
        options
      );
      // console.log(data.room_count);
      res.send(result);
    })

    app.get("/api/v1/bookings",verify, async (req,res)=>{

      const user = req.query.userEmail;
     
      let query = {}
      if(req.query.userEmail){
        query = {userEmail : req?.query.userEmail}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })
    app.get("/api/v1/bookings/:id", async (req,res)=>{

      const roomId = req.params.id;
      

      const query = {
        _id : new ObjectId(roomId)
      }

      const result = await bookingCollection.findOne(query);
      res.send(result)
    })

    app.delete("/api/v1/bookings/:id", async (req,res)=>{

      
      const id = req.params.id;
     
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bookingCollection.deleteOne(query);
      
      res.send(result);
    })

    app.patch('/api/v1/rooms/:id',async (req,res)=>{
      const id = req.params.id;
      const data = req.body; 
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedUSer = {
        $set: {
          "room_count" : data.room,
        },
      };
      const result = await roomCollection.updateOne(
        filter,
        updatedUSer,
        options
      );
      // console.log(data.room_count);
      res.send(result);
    })



    app.post("/api/v1/reviews", async (req,res)=>{
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    })

    app.get("/api/v1/reviews", async(req,res)=>{

      const id = req.query.roomId;
      

      const query = {}

      if(req.query.roomId){
        query.roomId = req.query.roomId;
      }
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    })

    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`This app running on port ${port}`)
})