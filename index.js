import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

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
const connectMongoDb = await connectToMongoDB();
const db = connectMongoDb.db("studio-space");
const studioCollection = db.collection("studios");
const bookingCollection = db.collection("bookings");

const verifyToken = async (req,res,next) => {
  const authData = req.headers.authorization;

  if(!authData) {
    return res.status(401).send({msg: 'Unauthorized'})
  }
  const token = authData.split(' ')[1]
  if(!token){
    return res.status(401).send({msg: "Unauthorized!"})
  }
  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
  )
  try{
    const {payload} = await jwtVerify(token,JWKS);
    next()
  }catch(error){
    return res.status(500).send({msg: 'Server Error'})
  }

}

app.get("/add-studio", async (req, res) => {
  const { category } = req.query;
  let query = {};
  if (category) {
    query.category = category;
  }
  const result = await studioCollection.find(query).toArray();
  res.send(result);
});

app.get("/featured-studios", async (req, res) => {
  const result = await studioCollection
    .find()
    .sort({ rating: -1 })
    .limit(6)
    .toArray();
  res.send(result);
});
app.post("/add-studio",verifyToken, async (req, res) => {
  const data = req.body;
  const randomRating = Number((Math.random() * (5.0 - 4.5) + 4.5).toFixed(1));
  const newStudioData = {
    ...data,
    rating: randomRating,
  };
  const result = await studioCollection.insertOne(newStudioData);
  res.send(result);
});

app.get("/add-studio/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await studioCollection.findOne(query);
  res.send(result);
});

app.get("/my-listings/:email",verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email };
  const result = await studioCollection.find(query).toArray();
  res.send(result);
});
app.delete("/add-studio/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await studioCollection.deleteOne(query);
  res.send(result);
});
app.patch("/add-studio/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updatedData = req.body;
  const updateDoc = {
    $set: {
      ...updatedData,
    },
  };
  const result = await studioCollection.updateOne(query, updateDoc);
  res.send(result);
});

app.post("/add-bookings", async (req, res) => {
  const data = req.body;
  const { studioId, startTime, endTime } = data;

  if (!studioId || !startTime || !endTime) {
    return res.status(400).send({
      success: false,
      message: "Studio ID, start time, and end time are required.",
    });
  }

  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  const conflictingBooking = await bookingCollection.findOne({
    studioId: studioId,
    status: { $in: [/pending/i, /confirmed/i] },
    $and: [
      { startTime: { $lt: newEnd } },
      { endTime: { $gt: newStart } }
    ],
  });

  if (conflictingBooking) {
    return res.status(400).send({
      success: false,
      message:
        "This studio is already booked for the selected time slot. Please choose a different date or time.",
    });
  }

  const newBookingData = {
    ...data,
    startTime: newStart,
    endTime: newEnd,
    status: data.status || "Pending",
    createdAt: new Date(),
  };

  const result = await bookingCollection.insertOne(newBookingData);

  res.send({
    success: true,
    message: "Studio booked successfully!",
    insertedId: result.insertedId,
    result,
  });
});

app.get("/my-bookings/:email",verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { userEmail: email };
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});

app.patch("/cancel-booking/:id",verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateData = req.body;

  const updateDoc = {
    $set: {
      ...updateData,
    },
  };
  const result = await bookingCollection.updateOne(query, updateDoc);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export default app