import React from "react";
import { FlexPlugin } from "@twilio/flex-plugin";

import CustomTaskList from "./components/CustomTaskList/CustomTaskList";

async function fetchMosScore(token, clientCallSid, baseUrl) {
  try {
    const response = await fetch(
      // `${process.env.SERVERLESS_DOMAIN}/get_mos_score`,
      `${baseUrl}/get_mos_score`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ Token: token, clientCallSid }), // Send the token in the body
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error calling Twilio Function:", error);
    return null;
  }
}

async function updateOriginalTask(
  payload,
  originalTaskAttributes,
  originalTaskSid
) {
  return new Promise((resolve, reject) => {
    const newOriginalTaskAttributes = {
      ...originalTaskAttributes,
      conversations: {
        conversation_id: originalTaskSid,
      },
    };
    // set new attributes on the task
    payload.setAttributes(newOriginalTaskAttributes);
    resolve(console.log(["[debug] New attributes set to original task"]));
  });
}

async function createTask(token, newAttributes, originalTaskSid, baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/create_mos_score_task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Token: token,
        attributes: newAttributes,
        originalTaskSid,
      }), // Send the token in the body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error calling Twilio Function:", error);
    return null;
  }
}

const PLUGIN_NAME = "MosScorePlugin";

export default class MosScorePlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   */
  async init(flex, manager) {
    // Using manager.events because there is no beforeTaskWrapup flex action listener for voice tasks
    manager.events.addListener("taskWrapup", async (payload) => {
      const baseUrl = process.env.FLEX_APP_FUNCTIONS_BASE_URL;
      const token = manager.store.getState().flex.session.ssoTokenPayload.token; // Get the Flex SSO token

      const clientCallSid = payload.attributes.conference.participants.worker;
      const originalTaskSid = payload.taskSid;
      const originalTaskAttributes = payload.attributes;

      console.log(["[debug] Original task: " + originalTaskSid]);

      if (originalTaskAttributes && !originalTaskAttributes.conference) {
        // no conference? no call! this functionality is call-specific, so return.
        console.log(["[debug] No conference attribute found. Returning..."]);
        return;
      }

      console.log(["[debug] Updating Original Task with conversation_id"]);
      updateOriginalTask(payload, originalTaskAttributes, originalTaskSid);
      console.log(["[debug] Original Task updated with conversation_id"]);

      const delay = 100; //in seconds
      console.log([
        "[debug] Waiting " +
          delay +
          " seconds to allow the MOS Score to be processed...",
      ]);

      setTimeout(async () => {
        console.log(["[debug] fetching MOS Score after delay..."]);
        const averageMOS = await fetchMosScore(token, clientCallSid, baseUrl);
        console.log(["[debug] Average MOS Score final result: " + averageMOS]);

        const newAttributes = {
          ...originalTaskAttributes,
          mos_score: averageMOS,
          conversations: {
            conversation_id: originalTaskSid,
            conversation_label_5: "mos_score",
            conversation_attribute_5: averageMOS,
            conversation_measure_5: averageMOS,
            channel: "mos_score",
            virtual: "Yes",
          },
        };

        console.log(["[debug] Updated the Task Attributes for the new task"]);

        console.log(["[debug] Calling function to create new task "]);
        const newTask = await createTask(
          token,
          newAttributes,
          originalTaskSid,
          baseUrl
        );
        console.log(["[debug] New Task created with sid: " + newTask.sid]);
      }, delay * 1000);
    });
  }
}
