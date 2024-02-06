const { Vonage } = require("@vonage/server-sdk");
require("dotenv").config();

const SendMobileSms = () => {
  const vonage = new Vonage({
    apiKey: process.env.vonage_api_key,
    apiSecret: process.env.vonage_api_secret,
  });
  const from = "919315238455";
  const to = "917982010317";
  const text = "A text message sent using the Vonage SMS API Md Monu";

  async function sendSMS() {
    await vonage.sms
      .send({ to, from, text })
      .then((resp) => {
        console.log("Message sent successfully");
        console.log(resp);
      })
      .catch((err) => {
        console.log("There was an error sending the messages.");
        console.error(err);
      });
  }

  sendSMS();
};

module.exports = { SendMobileSms };
