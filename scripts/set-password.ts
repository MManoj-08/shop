// Sets (or resets) the password of a user. Use it for the owner's first password,
// for staff, or when a customer has forgotten theirs.
//
//   npm run password:set -- 9876543210
//
// The password is typed at a hidden prompt, so it never appears on screen or in shell history.
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n" || c === "\u0004") {
          stdin.setRawMode?.(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(1); // Ctrl+C
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const phone = (process.argv[2] ?? "").trim();
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Usage: npm run password:set -- <10-digit mobile number>");

  let user = await db.user.findUnique({ where: { phone } });
  if (!user) {
    if (phone !== process.env.ADMIN_PHONE) {
      throw new Error("No user with this number. Customers sign up on the website; this script only sets passwords.");
    }
    user = await db.user.create({ data: { phone, role: "OWNER", name: "Owner" } });
    console.log("Owner account created.");
  }

  const password = await ask(`New password for ${user.name ?? phone} (${user.role}): `);
  if (password.length < 8 || Buffer.byteLength(password) > 72) throw new Error("Password must be 8 to 72 characters.");
  if (password !== (await ask("Type it again: "))) throw new Error("The two passwords do not match.");

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(password, 12), failedLogins: 0, lockedUntil: null },
  });
  console.log("Password saved. They can log in now.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
