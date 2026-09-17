import { Type } from "@google/genai";
import { JarvisToolDefinition } from "../toolTypes";

export const calendarTool: JarvisToolDefinition = {
  id: "tool-calendar",
  name: "manageCalendar",
  displayName: "Calendar & Schedule Engine",
  version: "1.0.0",
  category: "productivity",
  enabled: true,
  description: "Schedule events, set reminders, view upcoming appointments, and manage calendar itineraries.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "Action to perform: 'create_event', 'list_events', or 'delete_event'.",
      },
      title: {
        type: Type.STRING,
        description: "Title or meeting topic, e.g. 'Project Alpha Sync' or 'Team Standup'.",
      },
      date: {
        type: Type.STRING,
        description: "Event date, e.g. '2026-09-15' or 'Tomorrow 10:00 AM'.",
      },
      time: {
        type: Type.STRING,
        description: "Time of event, e.g. '14:00' or '2:30 PM'.",
      },
      durationMinutes: {
        type: Type.NUMBER,
        description: "Duration in minutes (default 30).",
      },
    },
    required: ["action"],
  },
  execute: (args, context) => {
    const action = args?.action || "list_events";

    if (action === "create_event") {
      const newEvent = {
        id: `cal-${Date.now()}`,
        title: args?.title || "Scheduled Reminder",
        date: args?.date || new Date().toISOString().split("T")[0],
        time: args?.time || "09:00 AM",
        durationMinutes: args?.durationMinutes || 30,
        createdAt: new Date().toISOString(),
      };
      context.addCalendarEvent(newEvent);

      return {
        result: {
          status: "Event successfully scheduled",
          event: newEvent,
          upcomingEventsCount: context.calendarEvents.length + 1,
        },
        sideEffect: { type: "CALENDAR_EVENT_ADDED", event: newEvent },
      };
    }

    return {
      result: {
        status: "Retrieved schedule",
        events: context.calendarEvents,
        count: context.calendarEvents.length,
      },
    };
  },
};
