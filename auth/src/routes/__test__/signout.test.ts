import request from "supertest";
import faker from "faker";

import { app } from "../../app";

it("clear cokkie after signing out", async () => {
  const signupData = {
    email: faker.internet.email(),
    password: faker.internet.password()
  };

  await request(app).post("/api/users/signup").send(signupData).expect(201);

  const response = await request(app)
    .post("/api/users/signout")
    .send({})
    .expect(200);

  expect(response.get("Set-Cookie")[0]).toEqual(
    "express:sess=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly"
  );
});