import { OrderCreatedEvent, OrderStatus } from "@rishtickets/common";
import faker from "faker";
import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCreatedListener } from "../order-created-listener";

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create and save ticket
  const ticket = Ticket.build({
    title: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price(undefined, undefined, 2)),
    userId: mongoose.Types.ObjectId().toHexString()
  });
  await ticket.save();

  // create data event
  const data: OrderCreatedEvent["data"] = {
    id: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: OrderStatus.Created,
    userId: mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date().toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price
    }
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn()
  };

  return { listener, data, msg };
};

it("sets uderId of ticket and acknowledges the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(data.ticket.id);

  expect(updatedTicket!.orderId).toEqual(data.id);

  expect(msg.ack).toHaveBeenCalled();
});

it("publishes a ticket updated event", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // ts now treats publish as a jest mock function
  const ticketStr = (natsWrapper.client.publish as jest.Mock).mock.calls[0][1];
  const ticket = JSON.parse(ticketStr);

  expect(ticket.orderId).toEqual(data.id);
});
