# Twilio Flex Solution to add MOS Score to Flex Insights

### Why was this created?

By default, Flex will **NOT** send MOS Score data to Flex Insights.

This solution will solve this problem by fetching the MOS Score and adding it to a conversation_attribute in the task attributes before the data is sent to Flex Insights.

## How does this work?

1. On the **front-end**, we use a [Flex Plugin](https://www.twilio.com/docs/flex/developer/ui-and-plugins) to listen for the ["taskWrapup" Flex Event](https://assets.flex.twilio.com/docs/releases/flex-ui/2.14.0/ui-actions/FlexEvent/#taskWrapup), get the worker leg of the conference (client call), and update the original task attributes with `conversations.conversation_id` set to its own task SID, which will link it to the new task afterwards.
2. Once the `taskWrapup` event is triggered, a 100 second delay is introduced (needed to get the MOS Score processed and ready), and a request is made to the **back-end**, the Twilio Function's `get_mos_score` path, where the [Call Metrics data](https://www.twilio.com/docs/voice/voice-insights/api/call/call-metrics-resource) is fetched via the Twilio Node Helper Library. This Function returns the MOS Score value to the plugin.
3. Then, on the **front-end**, the MOS Score is added as attribute `conversation_attribute_5` to the original task attributes. After adding the attribute `conversation_attribute_5`,
4. Lastly, from the plugin, a request is made to the [Twilio Serverless Function](https://www.twilio.com/docs/serverless/functions-assets/functions) `create_mos_score_task` path, where a request to create the new task with the new attributes is made.

## Flex Plugin

The code provided is intended to be incorporated into standard Flex Plugin architecture.

If you are new to Flex Plugins, follow these instructions to [set up a sample Flex plugin](https://www.twilio.com/docs/flex/quickstart/getting-started-plugin#set-up-a-sample-flex-plugin), navigate to the source file of your plugin, and add the sample code provided under src/MosScorePlugin.js

### Plugin Environment Variables

This Plugin is using an environment variable defined in a `.env` file. This stores the deployed Serverless Function URL:

`FLEX_APP_FUNCTIONS_BASE_URL` = Base URL to your Serverless Function (https://your-domain.twil.io)

To learn more about setting up Environment Variables in a Flex Plugin, check out [this doc](https://www.twilio.com/docs/flex/developer/plugins/environment-variables#:~:text=Keep%20in%20mind%20that%20the%20environment%20variable%20names%20are%20required%20to%20start%20with%20TWILIO_%2C%20FLEX_%20or%20REACT_).

## Serverless Function

A Serverless Function is used to process the custom Task logic.

### Dependencies

This Function uses the Flex Token Validator library, as explained this in this [Twilio documentation](https://www.twilio.com/docs/flex/developer/plugins/call-functions).

### Environment Variables

| Variable        | Example Identifier |
| --------------- | ------------------ |
| `WORKSPACE_SID` | WSxxxxxxxxxx       |
| `WORKFLOW_SID`  | WWxxxxxxxx         |

## Disclaimer

This software is to be considered "sample code", a Type B Deliverable, and is delivered "as-is" to the user. Twilio bears no responsibility to support the use or implementation of this software.
ponsibility to support the use or implementation of this software.
