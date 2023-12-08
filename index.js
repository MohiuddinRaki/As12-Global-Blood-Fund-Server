const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// console.log(process.env.STRIPE_SECRET_KEY);

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
    const donatorCreateRequestCollection = client
      .db("donationDB")
      .collection("donatorCreateRequest");
    const adminAddBlogCollection = client
      .db("donationDB")
      .collection("adminAddBlog");
    const contactUsCollection = client.db("donationDB").collection("contactUs");
    const UserFeedBackCollection = client
      .db("donationDB")
      .collection("userFeedBacks");
    // const paymentCollection = client.db("donationDB").collection("payments");

    // jwt related api:
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleWare:
    const verifyToken = (req, res, next) => {
      console.log("inside varify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "unAuthorized Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unAuthorized Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // use verfy admin after verifyToken:
    const verifyAdmin = async (req, res, next) => {
      const query = { email: email };
      const user = await donationUserCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbiden Access" });
      }
      next();
    };

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
      console.log(req.headers);
      const result = await donationUserCollection.find().toArray();
      res.send(result);
    });

    app.put("/dashboard/donationUsers/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateUserInfo = {
        $set: {
          name: item.name,
          email: item.email,
          district: item.district,
          upazila: item.upazila,
          blodGroup: item.blodGroup,
          image: item.image,
          role: item.role,
          status: item.status,
        },
      };
      const result = await donationUserCollection.updateOne(
        filter,
        updateUserInfo
      );
      res.send(result);
    });

    // for admin:
    app.get("/dashboard/donationUsers/:email", async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return req.status(403).send({ message: "forbidden access" });
      // }
      const query = { email: email };
      const user = await donationUserCollection.findOne(query);
      // let admin = false;
      // if (user) {
      //   admin = user?.role === "admin";
      // }
      admin = user?.role === "admin";
      console.log(admin);
      res.send({ admin });
    });

    app.patch("/dashboard/donationUsers/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await donationUserCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // for volunteer:
    app.get("/dashboard/donationUser/:email", async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return req.status(403).send({ message: "forbidden access" });
      // }
      const query = { email: email };
      const user = await donationUserCollection.findOne(query);
      // let volunteer = false;
      // if (user) {
      //   volunteer = user?.role === "volunteer";
      // }
      volunteer = user?.role === "volunteer";
      res.send({ volunteer });
    });

    app.patch("/dashboard/donationUser/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "volunteer",
        },
      };
      const result = await donationUserCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // // for User FeedBack in Home page:
    app.post("/userFeedBacks", async (req, res) => {
      const newUserFeedBacks = req.body;
      console.log(newUserFeedBacks);
      const result = await UserFeedBackCollection.insertOne(newUserFeedBacks);
      res.send(result);
    });

    app.get("/userFeedBacks", async (req, res) => {
      const cursor = UserFeedBackCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/userFeedBacks/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await UserFeedBackCollection.deleteOne(query);
      res.send(result);
    });

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

    // donor request related api:
    app.post("/donatorCreateRequest", async (req, res) => {
      const donatorCreateRequestInfo = req.body;
      console.log(donatorCreateRequestInfo);
      const result = await donatorCreateRequestCollection.insertOne(
        donatorCreateRequestInfo
      );
      res.send(result);
    });

    app.get("/donatorCreateRequest", async (req, res) => {
      const cursor = donatorCreateRequestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put("/dashboard/donatorCreateRequest/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDonorRequestInfo = {
        $set: {
          requesterName: item.requesterName,
          requesterEmail: item.requesterEmail,
          recipientName: item.recipientName,
          requestMessage: item.requestMessage,
          recipientDistrict: item.recipientDistrict,
          recipientUpazila: item.recipientUpazila,
          hospitalName: item.hospitalName,
          hospitalAddress: item.hospitalAddress,
          donationDate: item.donationDate,
          donationTime: item.donationTime,
          status: item.status,
        },
      };
      const result = await donatorCreateRequestCollection.updateOne(
        filter,
        updateDonorRequestInfo
      );
      res.send(result);
    });

    app.delete("/donatorCreateRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donatorCreateRequestCollection.deleteOne(query);
      res.send(result);
    });

    // Add Blog Admin request related api:
    app.post("/adminAddBlog", async (req, res) => {
      const blogsContentInfo = req.body;
      console.log(blogsContentInfo);
      const result = await adminAddBlogCollection.insertOne(blogsContentInfo);
      res.send(result);
    });

    app.get("/adminAddBlog", async (req, res) => {
      const result = await adminAddBlogCollection.find().toArray();
      res.send(result);
    });

    app.delete("/adminAddBlog/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await adminAddBlogCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/dashboard/adminAddBlog/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateAdminBlogInfo = {
        $set: {
          title: item.title,
          content: item.content,
          image: item?.image,
          status: item.status,
        },
      };
      const result = await adminAddBlogCollection.updateOne(
        filter,
        updateAdminBlogInfo
      );
      res.send(result);
    });

    // Contact Us api:
    app.post("/contactUs", async (req, res) => {
      const blogsContentInfo = req.body;
      console.log(blogsContentInfo);
      const result = await contactUsCollection.insertOne(blogsContentInfo);
      res.send(result);
    });

    // app.post("/create-payment-intent", async (req, res) => {
    //   const { donation } = req.body;
    //   const amount = parseInt(donation * 100);
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: ["card"],
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret,
    //   });
    // });

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
