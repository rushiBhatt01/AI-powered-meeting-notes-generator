import { inngest } from "./client";
import { processMeetingTranscript } from "./process-transcript";

export const processTranscript = inngest.createFunction(
  {
    id: "process-transcript",
    name: "Process Meeting Transcript",
    triggers: [{ event: "transcript.process" }],
  },
  async ({ event, step }) => {
    const { meetingId } = event.data as { meetingId: number };

    return await step.run("process-meeting-transcript", async () => {
      return await processMeetingTranscript(meetingId);
    });
  },
);
