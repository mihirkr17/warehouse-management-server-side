const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
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

function verifyJwt(req, res, next) {
   const authHeader = req.headers.authorization;

   if (!authHeader) {
      return res.status(401).send({ message: 'Unauthorized access' });
   }

   const token = authHeader.split(' ')[1];
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
         return res.status(403).send({ message: 'Forbidden access' });
      } else {
         req.decoded = decoded;
         next();
      }
   });
}

async function run() {
   try {
      await client.connect();
      const productCollection = client.db("productInventory").collection("product");
      const blogs = client.db('blogs').collection('blog');

      // JsonWebToken
      app.post('/login', async (req, res) => {
         const user = req.body;
         const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
         res.send({ accessToken });
      });

      // blog operation
      app.get('/blog', async (req, res) => {
         const query = {};
         const result = await blogs.find(query).toArray();
         res.send(result);
      });

      // Get Request for all products in inventory
      app.get('/inventory', async (req, res) => {
         const query = {};
         const cursor = productCollection.find(query);
         const result = await cursor.toArray();
         res.send(result);
      });

      // Get Request for one particular product
      app.get('/product', async (req, res) => {
         const id = req.query.productId;
         const query = { _id: ObjectId(id) };
         const result = await productCollection.findOne(query);
         res.send(result);
      });

      // Update product request
      app.put('/product', async (req, res) => {
         let stock;
         const id = req.query.productId;
         const reqBody = req.body;
         const filter = { _id: ObjectId(id) };
         const option = { upsert: true };
         stock = reqBody.quantity > 0 ? 'in' : 'out';
         const updateData = {
            $set: {
               quantity: reqBody.quantity,
               stock: stock
            }
         }
         const result = await productCollection.updateOne(filter, updateData, option);
         res.send(result);
      });

      // insert product into database
      app.post('/inventory', async (req, res) => {
         const data = req.body;
         const result = await productCollection.insertOne(data);
         res.send(result);
      })

      // find my-item request
      app.get('/my-inventory', verifyJwt, async (req, res) => {
         const decodedEmail = req.decoded.email;
         const email = req.query.email;
         if (email === decodedEmail) {
            const query = { userEmail: email };
            const result = await productCollection.find(query).toArray();
            res.send(result);
         } else {
            res.status(403).send({ message: 'Forbidden access' });
         }
      });

      // delete single item request from database
      app.delete('/product/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const result = await productCollection.deleteOne(query);
         res.send(result);
      });

   } finally { }
}
run().catch(console.dir());

app.listen(port, () => {
   console.log('Listening port ' + port);
});