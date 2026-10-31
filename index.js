import express from 'express';
import 'dotenv/config'
import { MongoClient } from 'mongodb';
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

app.post('/add-studio',async(req,res)=> {
  const data = req.body
  const result = await studioCollection.insertOne(data)
  res.send(result)
})
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});