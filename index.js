import express from 'express';
import 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import cors from "cors";

const app = express();
const port = 5000;

app.use(cors())
app.use(express.json())

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectMongoDb = await connectToMongoDB()
const db = connectMongoDb.db('studio-space')
const studioCollection = db.collection('studios')
const bookingCollection = db.collection('bookings')

app.get('/add-studio',async(req,res)=> {
  const result = await studioCollection.find({}).toArray()
  res.send(result)
})

app.post('/add-studio',async(req,res)=> {
  const data = req.body
  const result = await studioCollection.insertOne(data)
  res.send(result)
})

app.get('/add-studio/:id',async(req,res) => {
  const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const result = await studioCollection.findOne(query)
  res.send(result)
})


app.get('/my-listings/:email',async(req,res)=> {
  const email = req.params.email;
  const query = {userEmail: email}
  const result = await studioCollection.find(query).toArray()
  res.send(result)
})
app.delete('/add-studio/:id',async(req,res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await studioCollection.deleteOne(query)
  res.send(result)
})
app.patch('/add-studio/:id',async(req,res)=> {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const updatedData = req.body;
  const updateDoc = {
    $set: {
      ...updatedData
    }
  }
  const result = await studioCollection.updateOne(query,updateDoc)
  res.send(result)
})

app.post('/add-bookings',async(req,res)=>{
  const data = req.body;
  const result = await bookingCollection.insertOne(data)
  res.send(result)
})

app.get('/my-bookings/:email',async(req,res)=> {
  const email = req.params.email;
  const query = {userEmail: email}
  const result = await bookingCollection.find(query).toArray()
  res.send(result)
})

app.patch('/cancel-booking/:id', async (req, res) => {
  
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const updateData = req.body;

    const updateDoc = {
      $set: {
        ...updateData
      }
    };
    const result = await bookingCollection.updateOne(query, updateDoc);
    res.send(result);
  
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});