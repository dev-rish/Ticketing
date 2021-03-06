import { PaymentCreatedEvent, Publisher, Subjects } from "@rishtickets/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
