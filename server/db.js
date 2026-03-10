import mongoose from "mongoose";
import { config } from "./config.js";

const REQUIRED_COLLECTIONS = ["company", "investor", "stock", "transaction"];

export async function connectDatabase() {
  await mongoose.connect(config.mongoUri, {
    dbName: config.mongoDbName,
  });
}

export async function ensureCollectionsAndIndexes() {
  const db = mongoose.connection.db;
  const existingCollections = await db.listCollections({}, { nameOnly: true }).toArray();
  const existingNames = new Set(existingCollections.map((entry) => entry.name));

  for (const collectionName of REQUIRED_COLLECTIONS) {
    if (!existingNames.has(collectionName)) {
      await db.createCollection(collectionName);
    }
  }

  await db.collection("company").createIndex({ company_id: 1 }, { unique: true });
  await db.collection("company").createIndex({ email: 1 }, { unique: true });
  await db.collection("company").createIndex({ symbol: 1 }, { unique: true });

  await db.collection("investor").createIndex({ investor_id: 1 }, { unique: true });
  await db.collection("investor").createIndex({ email: 1 }, { unique: true });

  await db.collection("stock").createIndex({ stock_id: 1 }, { unique: true });
  await db.collection("stock").createIndex({ symbol: 1 }, { unique: true });
  await db.collection("stock").createIndex({ company_id: 1, created_at: -1 });

  await db.collection("transaction").createIndex({ transaction_id: 1 }, { unique: true });
  await db.collection("transaction").createIndex({ investor_id: 1, transaction_time: -1 });
  await db.collection("transaction").createIndex({ company_id: 1, transaction_time: -1 });
  await db.collection("transaction").createIndex({ stock_symbol: 1, transaction_time: -1 });
}
