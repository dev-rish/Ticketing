export class DatabaseConnectionError extends Error {
  statusCode = 500;
  reason = "Error connecting to database";

  constructor() {
    super();
    // NOTE: Required when extending a built in class
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeError() {
    return [{ message: this.reason }];
  }
}
