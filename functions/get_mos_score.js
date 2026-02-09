const TokenValidator = require("twilio-flex-token-validator").functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {
  const client = context.getTwilioClient();

  const response = new Twilio.Response();
  // Set the CORS headers to allow Flex to make an error-free HTTP request
  // to this Function
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "OPTIONS POST GET");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const { clientCallSid } = event;

  try {
    const metrics = await client.insights.v1
      .calls(clientCallSid)
      .metrics.list();

    // const lastItem = metrics.length - 1;
    // const lastItemValue = metrics[lastItem];
    // const lastMosScore = lastItemValue.sdkEdge.interval.mos.value;

    const mosScoresArray = [];
    metrics.forEach((m) => {
      mosScore = m.sdkEdge.interval.mos;
      if (mosScore !== undefined) {
        mosScoresArray.push(mosScore.value);
        //   console.log("MOS Score: " + mosScore.value);
      } else {
        console.log("No SDK Edge found");
      }
    });

    // average mosScoresArray
    const sum = mosScoresArray.reduce((a, b) => a + b, 0);
    const averageMOS = sum / mosScoresArray.length;
    console.log("Average MOS Score: " + averageMOS);
    // console.log("Last MOS Score: " + lastMosScore);

    response.appendHeader("Content-Type", "application/json");
    response.setBody(averageMOS);
    response.setStatusCode(200);
  } catch (error) {
    console.error(e);
    response.appendHeader("Content-Type", "plain/text");
    response.setBody(e.message);
    response.setStatusCode(501);
  }

  return callback(null, response);
});
