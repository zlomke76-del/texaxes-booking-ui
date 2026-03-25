window.TEX_AXES_LEAGUE_DATES = {
  timezone: "America/Chicago",
  seasonLengthWeeks: 8,

  seasons: [
    {
      label: "Season 2",
      startSunday: "2026-04-19"
    },
    {
      label: "Season 3",
      startSunday: "2026-07-19"
    },
    {
      label: "Season 4",
      startSunday: "2026-10-11"
    }
  ],

  pageTitle: "League Dates",
  eyebrow: "Official Tex Axes League Dates",
  title: "Tex Axes League Schedule",
  description:
    "Tex Axes league play runs from a single Sunday anchor date each season. Tuesday and Thursday schedules automatically follow from that opener, with each season running for eight weeks and finishing in tournament week.",

  meta: [
    "8-week season",
    "Sunday anchor schedule",
    "Tuesday + Thursday auto-derived",
    "Official WATL + WKTL play"
  ],

  format: {
    title: "8-Week Season Format",
    copy:
      "Each season begins on a Sunday opener. Tuesday and Thursday league nights follow automatically from that anchor, and the full season runs for eight weeks with tournament finish in week eight.",
    note:
      "Saturday marathon leagues are added separately as dates are finalized by discipline."
  },

  marathonIntro:
    "Marathon leagues usually run on Saturdays during the season. Dates are more fluid, so they are posted here as each discipline’s marathon date is confirmed.",

  marathon: [
    {
      title: "Current Marathon Status",
      copy:
        "Saturday marathon league dates are posted once finalized for each season and discipline."
    },
    {
      title: "How To Update This Section",
      copy:
        "Add marathon dates by discipline after the season is set. The weekly Sunday, Tuesday, and Thursday schedule remains anchored to the season Sunday opener."
    }
  ],

  footerNote:
    "League schedules and marathon dates may shift based on registration volume, operational timing, or season planning updates.",

  scheduleTemplates: {
    sunday: {
      dayLabel: "Sunday League",
      title: "Sunday",
      summary:
        "Sunday is the anchor night for the season and carries the fullest progression slate across hatchet, duals, knife, knife duals, and big axe.",
      schedule: [
        {
          time: "1:00 PM",
          title: "Warmups",
          copy: "Warmup and prep window before Sunday league play begins."
        },
        {
          time: "2:00 PM – 3:00 PM",
          title: "Hatchet League",
          copy: "Standard weekly hatchet league block."
        },
        {
          time: "3:00 PM – 4:00 PM",
          title: "Hatchet Duals",
          copy: "Partner-based duals competition immediately following hatchet."
        },
        {
          time: "4:00 PM – 5:00 PM",
          title: "Knife Throwing",
          copy: "Official weekly knife throwing league session."
        },
        {
          time: "5:00 PM – 6:00 PM",
          title: "Knife Duals",
          copy: "Knife partner format and duals block."
        },
        {
          time: "6:00 PM – 7:00 PM",
          title: "Big Axe",
          copy: "Sunday closes with the weekly big axe league window."
        }
      ]
    },

    tuesday: {
      dayLabel: "Tuesday League",
      title: "Tuesday",
      summary:
        "Tuesday focuses on knife formats and big axe, creating a strong midweek competitive progression night.",
      schedule: [
        {
          time: "5:30 PM",
          title: "Warmups",
          copy: "Warmup window before Tuesday league disciplines begin."
        },
        {
          time: "6:30 PM – 7:30 PM",
          title: "Knife League",
          copy: "Standard knife throwing league play."
        },
        {
          time: "7:30 PM – 8:00 PM",
          title: "Knife Duals",
          copy: "Shorter partner-based knife duals block."
        },
        {
          time: "8:00 PM – 9:00 PM",
          title: "Big Axe",
          copy: "Tuesday closes with big axe league competition."
        }
      ]
    },

    thursday: {
      dayLabel: "Thursday League",
      title: "Thursday",
      summary:
        "Thursday combines big axe and hatchet for a clean late-week competitive track.",
      schedule: [
        {
          time: "5:30 PM",
          title: "Warmups",
          copy: "Warmup and preparation before Thursday league starts."
        },
        {
          time: "6:30 PM – 7:00 PM",
          title: "Big Axe",
          copy: "Opening Thursday big axe block."
        },
        {
          time: "7:00 PM – 8:30 PM",
          title: "Hatchet",
          copy: "Main Thursday hatchet league session."
        }
      ]
    }
  }
};
