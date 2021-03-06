import { OrderStatus } from "@rishtickets/common";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { Document, Model, model, Schema } from "mongoose";

interface OrderAttrs {
  id: string;
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderDocument extends Document {
  version: number;
  userId: string;
  price: number;
  status: OrderStatus;
}

interface OrderModel extends Model<OrderDocument> {
  build(attrs: OrderAttrs): OrderDocument;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<OrderDocument | null>;
}

const orderSchema = new Schema(
  {
    userId: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus)
    }
  },
  {
    toJSON: {
      versionKey: false, // not include __v (could also be done via delete ret.__v)
      transform(doc, ret) {
        ret.id = ret._id;

        delete ret._id;

        return ret;
      }
    }
  }
);

orderSchema.set("versionKey", "version");
orderSchema.plugin(updateIfCurrentPlugin);

orderSchema.statics.build = (attrs: OrderAttrs) => {
  return new Order({
    _id: attrs.id,
    version: attrs.version,
    price: attrs.price,
    userId: attrs.userId,
    status: attrs.status
  });
};

orderSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Order.findOne({ _id: event.id, version: event.version - 1 });
};

const Order = model<OrderDocument, OrderModel>("Order", orderSchema);

export { Order };
