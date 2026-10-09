import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

export const createJoinConfig = async ({
  room,
  name,
}: {
  room: string;
  name: string;
}) => {
  // const response = await fetch(
  //     `${process.env.MIROTALK_URL}/api/v1/join?room=appointment-123`,
  //     {
  //         method: "POST",
  //         // headers: {
  //         //     authorization:
  //         //         process.env.MIROTALK_API_SECRET!,
  //         //     "Content-Type": "application/json",
  //         // },
  //         // body: JSON.stringify({
  //         //     room,
  //         //     name,
  //         // }),
  //     }
  // );

  // if (!response.ok) {
  //     throw new Error(
  //         `MiroTalk error: ${response.status}`
  //     );
  // }

  // const data = await response.json();

  // return data.join;


  const APP_ID = process.env.JAAS_APP_ID;      // vpaas-magic-cookie-...
  const KEY_ID = process.env.JAAS_KEY_ID;      // full kid from the console
  const PRIVATE_KEY = fs.readFileSync(
    path.join(__dirname, "jaas-private.pk"),
    "utf8"
  );
  const now = Math.floor(Date.now() / 1000);

  const token = jwt.sign(
    {
      aud: "jitsi",
      iss: "chat",
      sub: APP_ID,
      room,            // restricts the token to this room ("*" = any)
      nbf: now - 10,
      exp: now + 60 * 60,        // 1 hour
      context: {
        user: {
          // id: String(req.user.id),
          name,
          // email: req.user.email,
          moderator: "true",     // string "true"/"false", not a boolean
        },
        features: {
          // optional; availability depends on your plan
          recording: "false",
          livestreaming: "false",
        },
      },
    },
    PRIVATE_KEY,
    { algorithm: "RS256", header: { kid: KEY_ID, typ: "JWT", alg: "RS256" } }
  );
  return { jwt: token, appId: APP_ID, room };
};