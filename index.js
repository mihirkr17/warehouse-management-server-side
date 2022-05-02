const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Using Middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@cluster1.vfksi.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
   try {
      await client.connect();
      const productCollection = client.db("productInventory").collection("product");

      // Get Request for all product
      app.get('/product', async (req, res) => {
         const query = {};
         const cursor = productCollection.find(query);
         const result = await cursor.toArray();
         res.send(result);
      });

      // Get Request for one particular product
      app.get('/product/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const result = await productCollection.findOne(query);
         res.send(result);
      });

      // Update product request
      app.put('/product/:id', async (req, res) => {
         const id = req.params.id;
         const reqBody = req.body;
         const filter = { _id: ObjectId(id) };
         const option = { upsert: true };
         const updateData = {
            $set: {
               quantity: reqBody.quantity,
               stock: reqBody.stock
            }
         }
         const result = await productCollection.updateOne(filter, updateData, option);
         res.send(result);
      });

      // insert product into database
      app.post('/product', async (req, res) => {
         const data = req.body;
         const result = await productCollection.insertOne(data);
         res.send(result);
      })

   } finally { }
}
run().catch(console.dir());

app.listen(port, () => {
   console.log('Listening port ' + port);
});