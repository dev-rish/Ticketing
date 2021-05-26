import { Router, Request, Response } from "express";
import { body } from "express-validator";
import {
  NotFoundError,
  requireAuth,
  UnauthorizedError,
  validateRequest
} from "@rishtickets/common";

import { Ticket } from "../models/ticket";
import { TicketUpdatedPublisher } from "../events/publishers/ticket-updated-publisher";
import { natsWrapper } from "../nats-wrapper";

const router = Router();

router.put(
  "/api/tickets/:ticketId",
  requireAuth,
  [
    body("title").not().isEmpty().withMessage("Title is required"),
    body("price").isFloat({ gt: 0 }).withMessage("Price must be greater than 0")
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { title, price } = req.body;

    /**
     * NOTE: not using findOneAndUpdate because
     * OCC(via mongoose-update-if-current) only works
     * using .save() mehtod
     */
    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: req.currentUser!.id
    });

    if (!ticket) {
      throw new NotFoundError();
    }

    ticket.set({ title, price });
    ticket.save();

    await new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version
    });

    res.send(ticket);
  }
);

export { router as updateTicketRouter };
