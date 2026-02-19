import { sendOTPEmail } from "./src/services/email.service.js";

sendOTPEmail("tejaskhairnar.ukvalley@gmail.com", "Super@123", "login")
  .then(() => console.log("Done"))
  .catch(console.error);