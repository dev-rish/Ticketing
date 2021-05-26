import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import faker from "faker";
import jwt from "jsonwebtoken";

// Could also be done by making helper in separate file
declare global {
  namespace NodeJS {
    interface Global {
      signin(): {
        id: mongoose.Types.ObjectId;
        email: string;
        cookie: string[];
      };
    }
  }
}

jest.mock("../nats-wrapper");

let mongo: any;

beforeAll(async () => {
  process.env.JWT_KEY = "asdfe";

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  jest.clearAllMocks();

  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo;
});

global.signin = () => {
  const payload = {
    id: new mongoose.Types.ObjectId(),
    email: faker.internet.email()
  };

  const session = JSON.stringify({
    jwt: jwt.sign(payload, process.env.JWT_KEY!)
  });

  const base64 = Buffer.from(session).toString("base64");

  return {
    ...payload,
    cookie: [`express:sess=${base64}`]
  };
};