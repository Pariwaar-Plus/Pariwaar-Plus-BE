import { NotFoundError } from "../../../lib/error/NotfoundError";
import prisma from "../../config/prisma";
import { createMiroTalkJoinUrl } from "../../services/mirotalk.service";
import crypto from 'node:crypto';
import { findUserById } from "../auth/auth.service";

export const createVideoCallService = async () => {

  const roomId = crypto.randomBytes(8).toString("base64url");

  const videoCallDB = await prisma.videoCall.create({
    data: {
      roomId,
    },
  });

  return { roomId: videoCallDB.roomId }
};

export const findVideoCallByRoomId = async (roomId: string) => {
  const videoCallDB = await prisma.videoCall.findUnique({ where: { roomId } })

  if (!videoCallDB) {
    throw new NotFoundError(
      "Call not found"
    );
  }
  return videoCallDB
}

export const joinVideoCallService = async (roomId: string, userId: string) => {
  const videoCallDB = await findVideoCallByRoomId(
    roomId
  );

  // Important: authorization check
  // await videoCallService.checkCanJoin(videoCallDB, req.user);

  const user = await findUserById(userId)

  const joinUrl = await createMiroTalkJoinUrl({
    name: user.name,
    room: videoCallDB.roomId,
  });


  await prisma.videoCall.update({
    where: {
      id: videoCallDB.id,
    },
    data: {
      startedAt: new Date(),
    },
  });

  return {
    joinUrl,
  };
}



