const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware:
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rxjjt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const donationUserCollection = client
      .db("donationDB")
      .collection("donationUsers");
    const donatorDistrictCollection = client
      .db("donationDB")
      .collection("donatorDistrict");
    const donatorUpazilaCollection = client
      .db("donationDB")
      .collection("donatorUpazila");

    // user related api:
    app.post("/donationUsers", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await donationUserCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user alreday exist", insertedId: null });
      }
      const result = await donationUserCollection.insertOne(user);
      res.send(result);
    });

    app.get("/donationUsers", async (req, res) => {
      const result = await donationUserCollection.find().toArray();
      res.send(result);
    });

    app.patch("/donationUsers/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUserInfo = {
        $set: {
          name: item.name,
          district: item.district,
          upazila: item.upazila,
          blodGroup: item.blodGroup,
          image: item.image,
        },
      };
      const result = await donationUserCollection.updateOne(filter, updateUserInfo);
      res.send(result);
    });

    // app.get('/donationUsers/:email', async (req, res) => {
    //   const query = { email: req.params.email }
    //   // if (req.params.email !== req.decoded.email) {
    //   //   return res.status(403).send({ message: 'forbidden access' });
    //   // }
    //   const result = await donationUserCollection.find(query).toArray();
    //   res.send(result);
    // })

    // app.get('/donationUsers', async (req, res) => {
    //   try {
    //      if (!req.query.email) {
    //        return res.status(400).json({ error: "No email provided" });
    //      }
 
    //      const email = req.query.email;
    //      const query = { email: email };
    //      const result = await userCollection.find(query).toArray();
    //      res.json(result);
    //    } catch (error) {
    //      console.error("Error fetching user:", error);
    //      res.status(500).json({ error: "Internal server error" });
    //    }
    //  })

    //  donator District related api:
    app.get("/donatorDistrict", async (req, res) => {
      const result = await donatorDistrictCollection.find().toArray();
      res.send(result);
    });

    //  donator Upazila related api:
    app.get("/donatorUpazila", async (req, res) => {
      const result = await donatorUpazilaCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Blood Donation Application is Running");
});
app.listen(port, () => {
  console.log(`Blood Donation Application is Running on port ${port}`);
});
