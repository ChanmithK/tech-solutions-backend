const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Use CORS middleware
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Create a MySQL database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the MySQL database");
});

// Endpoint to get all products
app.get("/products", (req, res) => {
  connection.query(
    "SELECT * FROM product JOIN product_info ON product.id = product_info.product_id",
    (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json(results); // Send the results as JSON
    }
  );
});

// Endpoint to add a new product
app.post("/products", (req, res) => {
  const { name, description, price, category } = req.body; // Get product details from the request body
  connection.query(
    "INSERT INTO product (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      const productId = result.insertId; // Get the inserted product ID
      connection.query(
        "INSERT INTO product_info (product_id, description, price, category) VALUES (?, ?, ?, ?)",
        [productId, description, price, category],
        (err) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          res.send("Product added"); // Send success response
        }
      );
    }
  );
});

// Endpoint to get a single product
app.get("/products/:id", (req, res) => {
  const productId = req.params.id; // Extract product ID from request params
  connection.query(
    "SELECT * FROM product JOIN product_info ON product.id = product_info.product_id WHERE product.id = ?",
    [productId],
    (err, results) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      if (results.length === 0) {
        res.status(404).send("Product not found");
        return;
      }
      res.json(results[0]); // Send the first product found as JSON response
    }
  );
});

// Endpoint to update a product
app.put("/products/:id", (req, res) => {
  const productId = req.params.id; // Extract product ID from request params
  const { name, description, price, category } = req.body; // Get updated product details from request body

  // Update product table
  connection.query(
    "UPDATE product SET name = ? WHERE id = ?",
    [name, productId],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
        return;
      }

      // Update product_info table
      connection.query(
        "UPDATE product_info SET description = ?, price = ?, category = ? WHERE product_id = ?",
        [description, price, category, productId],
        (err) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          res.send(`Product ${productId} updated`); // Send success response
        }
      );
    }
  );
});

// Endpoint to delete a product
app.delete("/products/:id", (req, res) => {
  const productId = req.params.id; // Extract product ID from request params

  // Delete from product_info table first (assuming foreign key constraint)
  connection.query(
    "DELETE FROM product_info WHERE product_id = ?",
    [productId],
    (err) => {
      if (err) {
        res.status(500).send(err);
        return;
      }

      // Then delete from product table
      connection.query(
        "DELETE FROM product WHERE id = ?",
        [productId],
        (err) => {
          if (err) {
            res.status(500).send(err);
            return;
          }
          res.send(`Product ${productId} deleted`); // Send success response
        }
      );
    }
  );
});

// Start the server on port 3000
app.listen(3001, () => {
  console.log("Server is running on port 3000");
});
