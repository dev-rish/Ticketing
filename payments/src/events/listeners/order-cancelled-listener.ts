import {
  Listener,
  OrderCancelledEvent,
  OrderStatus,
  Subjects
} from "@rishtickets/common";
import { Message } from "node-nats-streaming";
import { Order } from "../../models/orders";
import { queueGroupName } from "./queue-group-name";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  readonly subject = Subjects.OrderCancelled;

  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    const order = await Order.findByEvent({
      id: data.id,
      version: data.version
    });

    if (!order) {
      throw new Error("Order not found");
    }

    order.status = OrderStatus.Cancelled;
    await order.save();

    msg.ack();
  }
}
