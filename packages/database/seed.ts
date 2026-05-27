import { db } from "./index";
import { themesTable } from "./models/theme";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Seeding themes...");

  const lightCssPath = path.join(__dirname, "themes", "light.css");
  const darkCssPath = path.join(__dirname, "themes", "dark.css");
  const forestCssPath = path.join(__dirname, "themes", "forest.css");

  const lightCss = fs.readFileSync(lightCssPath, "utf-8");
  const darkCss = fs.readFileSync(darkCssPath, "utf-8");
  const forestCss = fs.readFileSync(forestCssPath, "utf-8");

  // Insert themes or update them if they exist (clean slate seeding)
  // Let's delete existing themes first so we can cleanly recreate them
  await db.delete(themesTable);

  const lightTheme = await db.insert(themesTable).values({
    name: "Light Mode",
    code: { css: lightCss },
  }).returning();

  const darkTheme = await db.insert(themesTable).values({
    name: "Dark Mode",
    code: { css: darkCss },
  }).returning();

  const forestTheme = await db.insert(themesTable).values({
    name: "Forest",
    code: { css: forestCss },
  }).returning();

  console.log("Seeded Themes successfully:");
  console.log("Light Mode theme ID:", lightTheme[0]?.id);
  console.log("Dark Mode theme ID:", darkTheme[0]?.id);
  console.log("Forest theme ID:", forestTheme[0]?.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding themes:", err);
    process.exit(1);
  });
