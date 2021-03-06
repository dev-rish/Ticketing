import { Listener, OrderCreatedEvent, Subjects } from "@rishtickets/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/orders";
import { queueGroupName } from "./queue-group-name";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly subject = Subjects.OrderCreated;

  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    const order = await Order.build({
      id: data.id,
      version: data.version,
      price: data.ticket.price,
      userId: data.userId,
      status: data.status
    });
    await order.save();

    msg.ack();
  }
}
