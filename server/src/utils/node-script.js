const fs = require("fs");
const path = require("path");
const { exec, execSync } = require("child_process");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const csvFilePath = "C:\\Star POS Market\\export\\ARTICULOS.csv";
const tsvFilePath = path.join("C:\\Star POS Market\\export", "ARTICULOS.tsv");

const dbURL =
  "mongodb+srv://agustinmacazzaga:PZuJ288k4Kyn5vW5@ohmyveggie.4xaykot.mongodb.net/";
const dbNAME = "ohmyveggie";

const productSchema = new Schema(
  {
    name: String,
    category: String,
    image: String,
    price: Number,
    countInStock: Number,
    externalId: Number,
  },
  { timestamps: true }
);

const Product = model("Product", productSchema);
//Funciones para manejar las colecciones

const transform = (rawProduct) => {
  const product = {
    externalId: rawProduct.id,
    name: rawProduct.nombre,
    countInStock: rawProduct.stock,
    price: rawProduct.precio,
  };

  return product;
};

function transformEventHandler(db, fullDocument) {
  const product = transform(fullDocument);
  delete product._id;
  const productCollection = db.collection("products");

  return productCollection.updateOne(
    { externalId: product.externalId }, //Operadores de MongoDB
    { $set: product },
    { upsert: true }
  );
}

//Funciones pprincipales del script

const convertCsvToTsv = (csvFilePath, tsvFilePath, callback) => {
  fs.readFile(csvFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo el archivo CSV:", err);
      return;
    }

    // Reemplazar punto y coma por tabulación
    const tsvData = data.replace(/;/g, "\t");

    fs.writeFile(tsvFilePath, tsvData, "utf8", (err) => {
      if (err) {
        console.error("Error escribiendo el archivo TSV:", err);
        return;
      }

      console.log("El archivo CSV ha sido convertido a TSV correctamente.");
      callback();
    });
  });
};

const importToMongo = async () => {
  const escapedFilePath = tsvFilePath.replace(/\\/g, "\\\\");

  const client = new MongoClient(dbURL, {
    monitorCommands: true,
  });

  await client.connect();
  const db = client.db(dbNAME);
  const extProducts = db.collection("external-products");
  const deleteProd = await extProducts.deleteMany({});

  exec(
    `mongoimport --uri "mongodb+srv://agustinmacazzaga:PZuJ288k4Kyn5vW5@ohmyveggie.4xaykot.mongodb.net/ohmyveggie" --collection external-products --type tsv --headerline --file "${escapedFilePath}" --upsert --upsertFields id`,

    async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar mongoimport: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      console.log("Importación completada.");

      const arr = [];
      const extProducts = await db
        .collection("external-products")
        .find({})
        .toArray();

      extProducts.forEach((element) => {
        arr.push(transformEventHandler(db, element));
      });

      await Promise.all(arr).then((result) => console.log(result));

      const products = await db.collection("products").find({}).toArray();

      const extProductIds = new Set(
        extProducts
          .filter((product) => product.activo === "S")
          .map((prod) => prod.id)
      );

      const delThisProds = products
        .filter((p) => !extProductIds.has(p.externalId))
        .map((p) => p.externalId);

      await db
        .collection("products")
        .deleteMany({ externalId: { $in: delThisProds } });

      return;
    }
  );
};

const handleFileChange = (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    console.log("\nEl archivo", csvFilePath, "fue modificado!");
    console.log("El tipo de cambio fue: change");

    convertCsvToTsv(csvFilePath, tsvFilePath, importToMongo);
  }
};

fs.watchFile(csvFilePath, { interval: 10000 }, handleFileChange);

console.log(`Observando cambios en el archivo ${csvFilePath}`);
console.log("Presiona Ctrl+C para salir.");
