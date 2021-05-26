import mongoose from "mongoose";

import { app } from "./app";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listener";
import { natsWrapper } from "./nats-wrapper";

const start = async () => {
  if (!process.env.JWT_KEY) {
    throw new Error("Environment Variable 'JWT_KEY' not defined");
  }
  if (!process.env.MONGO_URI) {
    throw new Error("Environment Variable 'MONGO_URI' not defined");
  }
  if (!process.env.NATS_CLIENT_ID) {
    throw new Error("Environment Variable 'NATS_CLIENT_ID' not defined");
  }
  if (!process.env.NATS_URL) {
    throw new Error("Environment Variable 'NATS_URL' not defined");
  }
  if (!process.env.NATS_CLUSTER_ID) {
    throw new Error("Environment Variable 'NATS_CLUSTER_ID' not defined");
  }

  try {
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit();
    });
    process.on("SIGTERM", () => natsWrapper.client.close());
    process.on("SIGINT", () => natsWrapper.client.close());

    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log(err);
  }

  app.listen(3000, () => {
    console.log("Orders service listening on 3000!");
  });
};

start();
