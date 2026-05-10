import { sql } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  citiesTable,
  activitiesTable,
  tripsTable,
  stopsTable,
  stopActivitiesTable,
  checklistItemsTable,
  tripNotesTable,
} from "./index";
import { hashPassword, generateShareCode } from "../lib/auth.js";

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

async function seed() {
  await db.execute(sql`
    TRUNCATE TABLE
      stop_activities,
      checklist_items,
      trip_notes,
      stops,
      trips,
      activities,
      cities,
      users
    RESTART IDENTITY CASCADE
  `);

  const [admin, demo, traveler] = await db
    .insert(usersTable)
    .values([
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@traveloop.dev",
        passwordHash: hashPassword("Password123!"),
        city: "London",
        country: "United Kingdom",
        language: "en",
        isAdmin: true,
      },
      {
        firstName: "Lina",
        lastName: "Marquez",
        email: "lina@traveloop.dev",
        passwordHash: hashPassword("Password123!"),
        city: "Barcelona",
        country: "Spain",
        language: "en",
        isAdmin: false,
      },
      {
        firstName: "Ethan",
        lastName: "Kaur",
        email: "ethan@traveloop.dev",
        passwordHash: hashPassword("Password123!"),
        city: "Toronto",
        country: "Canada",
        language: "en",
        isAdmin: false,
      },
    ])
    .returning();

  const cities = await db
    .insert(citiesTable)
    .values([
      {
        name: "Barcelona",
        country: "Spain",
        region: "Catalonia",
        costIndex: 62,
        popularity: 95,
        imageUrl:
          "https://images.unsplash.com/photo-1464790719320-516ecd75af6c",
        description:
          "A Mediterranean city with beach promenades, Gaudi landmarks, and late-night tapas.",
      },
      {
        name: "Tokyo",
        country: "Japan",
        region: "Kanto",
        costIndex: 88,
        popularity: 98,
        imageUrl:
          "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
        description:
          "Neon-lit neighborhoods, ramen alleys, and serene shrines woven into a tech metropolis.",
      },
      {
        name: "Vancouver",
        country: "Canada",
        region: "British Columbia",
        costIndex: 74,
        popularity: 86,
        imageUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        description:
          "Oceanfront city with mountain views, rainforests, and coffee shops on every corner.",
      },
      {
        name: "Cape Town",
        country: "South Africa",
        region: "Western Cape",
        costIndex: 45,
        popularity: 82,
        imageUrl:
          "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
        description:
          "Table Mountain sunsets, coastal drives, and bold local cuisine.",
      },
      {
        name: "Rome",
        country: "Italy",
        region: "Lazio",
        costIndex: 70,
        popularity: 92,
        imageUrl:
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        description:
          "Ancient ruins, gelato alleys, and piazzas that buzz long after dusk.",
      },
    ])
    .returning();

  const cityMap = new Map(cities.map((city) => [city.name, city]));

  const activities = await db
    .insert(activitiesTable)
    .values([
      {
        cityId: cityMap.get("Barcelona")!.id,
        name: "Sagrada Familia tour",
        description: "Guided early-access tour with photo stops.",
        type: "sightseeing",
        cost: 38,
        duration: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd",
      },
      {
        cityId: cityMap.get("Barcelona")!.id,
        name: "Sunset tapas crawl",
        description: "Three neighborhoods, six tastings, one sunset.",
        type: "food",
        cost: 52,
        duration: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
      },
      {
        cityId: cityMap.get("Tokyo")!.id,
        name: "Shibuya night photo walk",
        description: "Capture neon streets with a local photographer.",
        type: "culture",
        cost: 40,
        duration: 2.5,
        imageUrl:
          "https://images.unsplash.com/photo-1505066836043-7bbf1b2d0b23",
      },
      {
        cityId: cityMap.get("Tokyo")!.id,
        name: "Tsukiji market breakfast",
        description: "Chef-led tasting tour of the morning market.",
        type: "food",
        cost: 55,
        duration: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1498654896293-37aacf113fd9",
      },
      {
        cityId: cityMap.get("Vancouver")!.id,
        name: "Stanley Park bike loop",
        description: "Guided ride with ocean viewpoints and local history.",
        type: "outdoors",
        cost: 26,
        duration: 2.5,
        imageUrl:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
      {
        cityId: cityMap.get("Vancouver")!.id,
        name: "Granville Island food tour",
        description: "Craft markets, coffee roasters, and bakeries.",
        type: "food",
        cost: 48,
        duration: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1473093226795-af9932fe5856",
      },
      {
        cityId: cityMap.get("Cape Town")!.id,
        name: "Table Mountain cableway",
        description: "Return ticket with guided summit walk.",
        type: "outdoors",
        cost: 32,
        duration: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429",
      },
      {
        cityId: cityMap.get("Cape Town")!.id,
        name: "Bo-Kaap culture tour",
        description: "Walk through colorful streets and local stories.",
        type: "culture",
        cost: 22,
        duration: 2,
        imageUrl:
          "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
      },
      {
        cityId: cityMap.get("Rome")!.id,
        name: "Colosseum after-hours",
        description: "Small-group access to underground chambers.",
        type: "sightseeing",
        cost: 64,
        duration: 2.5,
        imageUrl:
          "https://images.unsplash.com/photo-1526481280695-3c687fd643ed",
      },
      {
        cityId: cityMap.get("Rome")!.id,
        name: "Trastevere pasta class",
        description: "Hands-on cooking lesson with local chef.",
        type: "food",
        cost: 58,
        duration: 3,
        imageUrl:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      },
    ])
    .returning();

  const activityMap = new Map(
    activities.map((activity) => [activity.name, activity]),
  );

  const [barcelonaTrip, japanTrip, italyTrip] = await db
    .insert(tripsTable)
    .values([
      {
        userId: demo.id,
        name: "Barcelona + Rome escape",
        startDate: addDays(-12),
        endDate: addDays(-2),
        description:
          "Food-forward spring adventure with architecture, markets, and late-night strolls.",
        coverPhoto:
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
        isPublic: true,
        shareCode: generateShareCode(),
        totalBudget: 2200,
      },
      {
        userId: demo.id,
        name: "Tokyo food and neon",
        startDate: addDays(6),
        endDate: addDays(14),
        description:
          "Future-meets-tradition itinerary with ramen tastings and skyline walks.",
        coverPhoto:
          "https://images.unsplash.com/photo-1505066836043-7bbf1b2d0b23",
        isPublic: false,
        shareCode: null,
        totalBudget: 2800,
      },
      {
        userId: traveler.id,
        name: "Pacific Northwest retreat",
        startDate: addDays(-1),
        endDate: addDays(4),
        description: "Nature-forward getaway with bike rides and harbor views.",
        coverPhoto:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
        isPublic: true,
        shareCode: generateShareCode(),
        totalBudget: 1400,
      },
    ])
    .returning();

  const [barcelonaStop, romeStop, tokyoStop, vancouverStop] = await db
    .insert(stopsTable)
    .values([
      {
        tripId: barcelonaTrip.id,
        cityId: cityMap.get("Barcelona")!.id,
        startDate: addDays(-12),
        endDate: addDays(-8),
        order: 1,
        notes: "Stay near the Gothic Quarter for walkability.",
      },
      {
        tripId: barcelonaTrip.id,
        cityId: cityMap.get("Rome")!.id,
        startDate: addDays(-8),
        endDate: addDays(-2),
        order: 2,
        notes: "Late-night gelato runs after dinner.",
      },
      {
        tripId: japanTrip.id,
        cityId: cityMap.get("Tokyo")!.id,
        startDate: addDays(6),
        endDate: addDays(14),
        order: 1,
        notes: "Split stays between Shibuya and Asakusa.",
      },
      {
        tripId: italyTrip.id,
        cityId: cityMap.get("Vancouver")!.id,
        startDate: addDays(-1),
        endDate: addDays(4),
        order: 1,
        notes: "Book bike rentals ahead of time.",
      },
    ])
    .returning();

  await db.insert(stopActivitiesTable).values([
    {
      stopId: barcelonaStop.id,
      activityId: activityMap.get("Sagrada Familia tour")!.id,
      date: addDays(-11),
      time: "10:30",
      cost: 38,
    },
    {
      stopId: barcelonaStop.id,
      activityId: activityMap.get("Sunset tapas crawl")!.id,
      date: addDays(-10),
      time: "18:00",
      cost: 52,
    },
    {
      stopId: romeStop.id,
      activityId: activityMap.get("Colosseum after-hours")!.id,
      date: addDays(-7),
      time: "19:30",
      cost: 64,
    },
    {
      stopId: romeStop.id,
      activityId: activityMap.get("Trastevere pasta class")!.id,
      date: addDays(-5),
      time: "17:00",
      cost: 58,
    },
    {
      stopId: tokyoStop.id,
      activityId: activityMap.get("Shibuya night photo walk")!.id,
      date: addDays(8),
      time: "20:00",
      cost: 40,
    },
    {
      stopId: tokyoStop.id,
      activityId: activityMap.get("Tsukiji market breakfast")!.id,
      date: addDays(9),
      time: "08:00",
      cost: 55,
    },
    {
      stopId: vancouverStop.id,
      activityId: activityMap.get("Stanley Park bike loop")!.id,
      date: addDays(0),
      time: "09:30",
      cost: 26,
    },
    {
      stopId: vancouverStop.id,
      activityId: activityMap.get("Granville Island food tour")!.id,
      date: addDays(2),
      time: "12:00",
      cost: 48,
    },
  ]);

  await db.insert(checklistItemsTable).values([
    {
      tripId: barcelonaTrip.id,
      name: "Passport + copy",
      category: "documents",
      isPacked: true,
    },
    {
      tripId: barcelonaTrip.id,
      name: "City walking shoes",
      category: "clothing",
      isPacked: true,
    },
    {
      tripId: barcelonaTrip.id,
      name: "Light rain jacket",
      category: "gear",
      isPacked: false,
    },
    {
      tripId: japanTrip.id,
      name: "JR transit card",
      category: "documents",
      isPacked: false,
    },
    {
      tripId: japanTrip.id,
      name: "Portable charger",
      category: "gear",
      isPacked: false,
    },
    {
      tripId: italyTrip.id,
      name: "Reusable water bottle",
      category: "gear",
      isPacked: true,
    },
  ]);

  await db.insert(tripNotesTable).values([
    {
      tripId: barcelonaTrip.id,
      stopId: barcelonaStop.id,
      content: "Try the rooftop bar near the cathedral for sunset views.",
    },
    {
      tripId: barcelonaTrip.id,
      stopId: romeStop.id,
      content: "Book Colosseum tickets in advance to avoid long lines.",
    },
    {
      tripId: japanTrip.id,
      stopId: tokyoStop.id,
      content: "Save cash for smaller ramen shops and vending machines.",
    },
    {
      tripId: italyTrip.id,
      stopId: vancouverStop.id,
      content: "Pack a light layer for the evening seawall walk.",
    },
  ]);

  console.log("Seed completed.");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
