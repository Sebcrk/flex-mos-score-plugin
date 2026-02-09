const TokenValidator = require("twilio-flex-token-validator").functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {
  const client = context.getTwilioClient();
  let { attributes } = event;
  const { WORKSPACE_SID, WORKFLOW_SID } = context;

  //TODO: continue working on getting the right attributes and test
  const response = new Twilio.Response();
  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "OPTIONS POST GET");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const createTask = async (WORKSPACE_SID, WORKFLOW_SID) => {
    const task = await client.taskrouter.v1
      .workspaces(WORKSPACE_SID)
      .tasks.create({
        attributes: JSON.stringify(attributes),
        workflowSid: WORKFLOW_SID,
        taskChannel: "mos_score",
      });

    console.log("created task", task.sid, attributes);
    return task;
  };

  try {
    const task = await createTask(WORKSPACE_SID, WORKFLOW_SID);
    console.log(["[debug] Task created with sid: " + task.sid]);

    response.appendHeader("Content-Type", "application/json");
    response.setBody(task);
  } catch (e) {
    console.error(e);
    response.appendHeader("Content-Type", "plain/text");
    response.setBody(e.message);
    response.setStatusCode(500);
  }

  return callback(null, response);
});
