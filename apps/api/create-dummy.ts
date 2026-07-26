import { db } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import * as argon2 from "argon2";

async function main() {
  const hash = await argon2.hash("password123");
  await db.insert(usersTable).values({
    email: "dummy@example.com",
    firstName: "Dummy",
    lastName: "User",
    password: hash,
    emailVerified: true
  });
  console.log("Dummy user successfully inserted into DB!");
}

main().catch(console.error).finally(() => process.exit(0));
